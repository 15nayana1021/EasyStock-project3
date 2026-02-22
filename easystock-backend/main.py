from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import asyncio
import random
from datetime import datetime
import aiosqlite
from pydantic import BaseModel
from urllib.parse import unquote
from collections import defaultdict
from sqlalchemy import or_
from core.mentor_brain import chat_with_mentor

# 엔진과 모델 임포트

from database import init_db, SessionLocal, DBCompany, DBAgent
from routers import trade, social, news
from models.domain_models import Order, OrderType, OrderSide, Agent # 주문 모델
from team_api import router as team_router
from main_simulation import market_engine as engine, run_simulation_loop
import main_simulation

# [전역 설정]
TARGET_TICKERS = [
    "삼송전자", "재웅시스템", "에이펙스테크",      # 전자
    "마이크로하드", "소현컴퍼니", "넥스트데이터", # IT
    "진호랩", "상은테크놀로지", "인사이트애널리틱스",    # 바이오
    "선우솔루션", "퀀텀디지털", "예진캐피탈" # 금융
]

# 2. 각 기업의 상장 시초가 설정 (원하시는 금액으로 조정 가능합니다)
INITIAL_PRICES = {
    "삼송전자": 172000,
    "재웅시스템": 45000,
    "에이펙스테크": 28000,
    "마이크로하드": 580000,
    "소현컴퍼니": 62000,
    "넥스트데이터": 34000,
    "진호랩": 89000,
    "상은테크놀로지": 54000,
    "인사이트애널리틱스": 41000,
    "선우솔루션": 22000,
    "퀀텀디지털": 115000,
    "예진캐피탈": 198000
}

COMPANY_CATEGORIES = {
    "삼송전자": "전자", "재웅시스템": "전자", "에이펙스테크": "전자",
    "마이크로하드": "IT", "소현컴퍼니": "IT", "넥스트데이터": "IT",
    "진호랩": "바이오", "상은테크놀로지": "바이오", "인사이트애널리틱스": "바이오",
    "선우솔루션": "금융", "퀀텀디지털": "금융", "예진캐피탈": "금융"
}

TICKER_MAP = {
    "삼송전자": "SS011", "재웅시스템": "JW004", "에이펙스테크": "AT010",
    "마이크로하드": "MH012", "소현컴퍼니": "SH001", "넥스트데이터": "ND008",
    "진호랩": "JH005", "상은테크놀로지": "SE002", "인사이트애널리틱스": "IA009",
    "선우솔루션": "SW006", "퀀텀디지털": "QD007", "예진캐피탈": "YJ003"
}

# 🏆 [랭킹 점수판] 
hot_scores = {ticker: 0 for ticker in TARGET_TICKERS}

# 초기 데이터 (전역 변수 - 종목별 관리)
current_news_display = "장 시작 준비 중..."
price_history = {ticker: [] for ticker in TARGET_TICKERS}
current_mentor_comments = {ticker: [] for ticker in TARGET_TICKERS}
news_history_storage = []


# 시뮬레이션 엔진
async def simulate_market_background():
    global current_news_display, price_history, current_mentor_comments
    
    print("🚀 [시스템] 유저 주문 모니터링 시작 (기존 엔진 로직 제거됨)")
    
    # 1. DB 연결 (유지)
    db = await aiosqlite.connect("stock_game.db", timeout=30.0)
    await db.execute("PRAGMA journal_mode=WAL;") 
    db.row_factory = aiosqlite.Row

    try:     
        # 3. [무한 루프] 
        loop_count = 0
        while True:
            await asyncio.sleep(1) 
            loop_count += 1
            """
            async with db.execute("SELECT * FROM orders WHERE status = 'PENDING'") as cursor:
                pending_orders = await cursor.fetchall()

            for db_order in pending_orders:
                # ... 기존 체결 로직 ...
            """

    except Exception as e:
        print(f"❌ 모니터링 에러: {e}")
    finally:
        await db.close()

def seed_database():
    with SessionLocal() as db:
        print("🌱 [시스템] DB 데이터를 보존하며 INITIAL_PRICES를 동기화합니다...")
        
        for name, price in INITIAL_PRICES.items():
            correct_ticker = TICKER_MAP.get(name, name)
            company = db.query(DBCompany).filter(DBCompany.name == name).first()
            
            if company:
                company.ticker = correct_ticker
                company.current_price = float(price)
            else:
                new_comp = DBCompany(
                    ticker=correct_ticker,
                    name=name, 
                    current_price=float(price),
                    change_rate=0.0
                )
                db.add(new_comp)
        
        db.commit()

        if db.query(DBAgent).count() == 0:
            print("🤖 [시스템] AI 에이전트 30명을 시장에 투입합니다...")
            agents = [
                DBAgent(agent_id=f"Agent_Bot_{i}", cash_balance=100000000, portfolio={}, psychology={})
                for i in range(1, 31)
            ]
            db.add_all(agents)
            db.commit()
            
        print("✅ [시스템] 주식 가격 및 영어 코드(Ticker) 동기화 완료!")

# [FastAPI 앱 설정]
@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_database() 
    
    # 2. 기존 시뮬레이션 가동 코드 (유지)
    main_simulation.running = True
    asyncio.create_task(run_simulation_loop())
    print("🚀 [통합 완료] 시뮬레이션과 서버가 한 몸으로 가동됩니다!")
    
    yield 

    # 3. 종료 코드 (유지)
    print("🛑 서버 종료 신호 감지! 시뮬레이션을 안전하게 중단합니다.")
    main_simulation.running = False
    await asyncio.sleep(1)

app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:3000",    # React 기본 주소
    "http://127.0.0.1:3000",
    "http://localhost:5173",    # Vite/Next.js 기본 주소
]

# 2. 미들웨어를 설정합니다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trade.router)
app.include_router(social.router, prefix="/api/social", tags=["Social & Ranking"])
app.include_router(news.router)
app.include_router(team_router, prefix="/team", tags=["Team API"])

@app.get("/api/market-data")
async def get_market_data(ticker: str = "삼송전자"):
    if ticker not in engine.companies:
        print(f"⚠️ 경고: 존재하지 않는 종목 요청 들어옴 -> {ticker}")
        return {"error": "Stock not found", "ticker": ticker}
    
    if ticker in hot_scores:
        hot_scores[ticker] += 0.1
        hot_scores[ticker] = round(hot_scores[ticker], 1)
        
        #print(f"[내 관심] '{ticker}' 조회수 UP! (현재 점수: {hot_scores[ticker]})")

    comp = engine.companies[ticker]
    book = engine.order_books.get(ticker, {"BUY": [], "SELL": []})
    
    # 엔진 호가
    buy_orders = [o.dict() for o in book["BUY"][:5]]
    sell_orders = [o.dict() for o in book["SELL"][:5]]

    if ticker in hot_scores:
        hot_scores[ticker] += 1

    return {
        "ticker": ticker,     
        "name": ticker,
        "price": comp.current_price,
        "news": current_news_display,
        "history": price_history.get(ticker, []),
        "buy_orders": buy_orders,
        "sell_orders": sell_orders,
        "mentors": current_mentor_comments.get(ticker, [])
    }

@app.get("/api/stocks")
async def get_all_stocks():
    try:
        with SessionLocal() as db:
            companies = db.query(DBCompany).all()
            result = []
            for c in companies:
                result.append({
                    "ticker": str(c.ticker) if c.ticker else "UNKNOWN",
                    "name": str(c.name) if c.name else "알 수 없음",
                    "current_price": int(c.current_price) if c.current_price is not None else 0,
                    "change_rate": float(c.change_rate) if hasattr(c, 'change_rate') and c.change_rate is not None else 0.0
                })
            return result
    except Exception as e:
        print(f"❌ 목록 로딩 에러: {e}")
        return []
# 로그인 및 회원가입 API
class LoginRequest(BaseModel):
    nickname: str

@app.post("/users/login")
async def login_user(request: LoginRequest):
    """
    닉네임을 받아서, 처음 온 유저면 가입시키고 100만원을 줍니다.
    이미 있는 유저면 그냥 로그인 성공 처리합니다.
    """
    async with aiosqlite.connect("stock_game.db") as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                balance INTEGER
            )
        """)
        
        # 닉네임이 있으면 무시(IGNORE), 없으면 새로 만들고 100만원 지급
        await db.execute("""
            INSERT OR IGNORE INTO users (username, balance) 
            VALUES (?, 1000000)
        """, (request.nickname,))
        
        await db.commit()
        
        cursor = await db.execute("SELECT id FROM users WHERE username = ?", (request.nickname,))
        user_row = await cursor.fetchone()
        real_user_id = user_row[0] if user_row else 1
        
    return {
        "success": True, 
        "message": f"Welcome {request.nickname}!", 
        "user_id": real_user_id
    }

class ChatRequest(BaseModel):
    agent_type: str
    message: str

#챗봇
@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    try:
        reply = await chat_with_mentor(req.agent_type, req.message)
        return {"reply": reply}
    except Exception as e:
        print(f"❌ 챗봇 응답 에러: {e}")
        return {"reply": "앗, 뇌 회로에 잠시 과부하가 왔어요! 조금만 이따가 다시 질문해주세요."}

# 2. 내 자산 정보 API (프론트엔드 연동용)
@app.get("/users/me/portfolio")
async def get_my_portfolio(user_id: str = "1"): 
    """
    닉네임(user_id)을 받아서 자산 정보를 조회합니다.
    """
    async with aiosqlite.connect("stock_game.db") as db:
        db.row_factory = aiosqlite.Row
        
        # 1. 먼저 '닉네임(username)'으로 유저를 찾습니다!
        async with db.execute("SELECT id, username, balance FROM users WHERE username = ? OR id = ?", (user_id, user_id)) as cursor:
            user = await cursor.fetchone()
            
            if not user:
                return {
                    "name": "알 수 없음",
                    "cash_balance": 0,
                    "total_asset_value": 0,
                    "portfolio": []
                }
            
            # DB에 저장된 진짜 고유 번호(예: 1, 2, 3...)와 잔고를 가져옵니다.
            real_db_id = user["id"] 
            cash = user["balance"]
            name = user["username"]

        # 2. 보유 주식 조회 (user_id 컬럼은 숫자 ID로 연결되어 있으므로 real_db_id 사용)
        portfolio = []
        total_stock_value = 0
        
        async with db.execute("SELECT company_name, quantity, average_price FROM holdings WHERE user_id = ?", (real_db_id,)) as cursor:
            rows = await cursor.fetchall()
            for row in rows:
                ticker = row["company_name"]
                qty = row["quantity"]
                avg_price = row["average_price"]
                
                # 현재가는 엔진에서 가져옴
                current_price = engine.companies[ticker].current_price if ticker in engine.companies else avg_price
                
                profit_rate = ((current_price - avg_price) / avg_price) * 100 if avg_price > 0 else 0
                
                portfolio.append({
                    "ticker": ticker,
                    "quantity": qty,
                    "current_price": int(current_price),
                    "profit_rate": round(profit_rate, 2),
                    "average_price": int(avg_price)
                })
                
                total_stock_value += (current_price * qty)

    return {
        "name": name,
        "cash_balance": int(cash),
        "total_asset_value": int(cash + total_stock_value),
        "portfolio": portfolio
    }
# 3. 종목 상세 조회 (프론트엔드 연동용)
@app.get("/api/stocks/{ticker}")
async def get_stock_detail(ticker: str):
    if ticker not in engine.companies:
        return {"error": "Stock not found"}
    comp = engine.companies[ticker]
    return {
        "ticker": ticker,
        "name": ticker,
        "sector": COMPANY_CATEGORIES.get(ticker, "Tech"),
        "current_price": int(comp.current_price),
    }

# 2. 차트 데이터 API (프론트엔드 fetchStockChart 대응)
@app.get("/api/stocks/{ticker}/chart")
async def get_stock_chart(ticker: str, period: str = "1d"):
    if ticker not in price_history:
        return []
    return price_history.get(ticker, [])

# 3. 호가창 데이터 API (프론트엔드 fetchOrderBook 대응)
@app.get("/api/stocks/{ticker}/orderbook")
async def get_stock_orderbook(ticker: str):
    with SessionLocal() as db:
        company = db.query(DBCompany).filter(
            or_(DBCompany.ticker == ticker, DBCompany.name == ticker)
        ).first()

        if not company:
            return {"error": "Stock not found"}

        actual_ticker = company.ticker
        current_price = int(company.current_price)

    book = engine.order_books.get(actual_ticker, {"SELL": [], "BUY": []})

    # 💡 1. 매도(SELL) 주문을 같은 가격끼리 묶어서 수량(volume)을 더합니다!
    ask_summary = defaultdict(int)
    for o in book.get("SELL", []):
        ask_summary[int(o["price"])] += o["quantity"]
        
    # 💡 2. 매수(BUY) 주문도 같은 가격끼리 묶어줍니다!
    bid_summary = defaultdict(int)
    for o in book.get("BUY", []):
        bid_summary[int(o["price"])] += o["quantity"]

    # 3. 묶여진 데이터를 가격 순서대로 정렬하고 5개만 자릅니다.
    asks = [{"price": p, "volume": v} for p, v in sorted(ask_summary.items())][:5]
    bids = [{"price": p, "volume": v} for p, v in sorted(bid_summary.items(), reverse=True)][:5]

    return {
        "ticker": actual_ticker,
        "current_price": current_price,
        "asks": asks,
        "bids": bids
    }

@app.get("/api/stocks/{ticker}/news")
async def get_stock_news(ticker: str):
    decoded_ticker = unquote(ticker)
    
    async with aiosqlite.connect("stock_game.db") as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("""
            SELECT id, ticker, title, source, created_at as time, category, content, summary 
            FROM news 
            WHERE ticker LIKE ? OR title LIKE ?
            ORDER BY id DESC 
            LIMIT 50
        """, (f"%{decoded_ticker}%", f"%{decoded_ticker}%")) 
        
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]

@app.get("/api/ranking/hot")
def get_hot_ranking():
    # 1. 인기 점수(hot_scores) 기준 정렬
    sorted_ranking = sorted(hot_scores.items(), key=lambda x: x[1], reverse=True)[:12]
    
    response_data = []
    with SessionLocal() as db:
        for rank, (ticker_name, score) in enumerate(sorted_ranking, 1):
            company = db.query(DBCompany).filter(
                or_(DBCompany.ticker == ticker_name, DBCompany.name == ticker_name)
            ).first()
            
            if company:
                price = int(company.current_price) if company.current_price else 0
                change = float(company.change_rate) if hasattr(company, 'change_rate') and company.change_rate else 0.0
                name = company.name if company.name else ticker_name
                symbol = company.ticker
            else:
                # DB에 정말 없을 경우
                price = 0
                change = 0.0
                name = ticker_name
                symbol = ticker_name

            response_data.append({
                "rank": rank,
                "ticker": symbol,
                "name": name,
                "score": score,
                "current_price": price,
                "change_rate": round(change, 2)
            })
            
    return response_data
@app.get("/api/news")
async def get_all_news():
    async with aiosqlite.connect("stock_game.db") as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("""
            SELECT id, ticker, title, source, created_at as time 
            FROM news 
            ORDER BY id DESC 
            LIMIT 20
        """)
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]

# 시장(Market) 상세화면용: 특정 종목 뉴스만 가져옴
@app.get("/api/stocks/{ticker}/news")
async def get_stock_news(ticker: str):
    async with aiosqlite.connect("stock_game.db") as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("""
            SELECT id, ticker, title, source, created_at as time 
            FROM news 
            WHERE ticker = ? 
            ORDER BY id DESC 
            LIMIT 20
        """, (ticker,))
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]

app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, access_log=False)