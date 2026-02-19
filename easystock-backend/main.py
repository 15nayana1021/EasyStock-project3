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

# 엔진과 모델 임포트

from database import init_db
from routers import trade, social, news
from core.market_engine import MarketEngine  # 진짜 엔진
from models.domain_models import Order, OrderType, OrderSide, Agent # 주문 모델

# [전역 설정]
TARGET_TICKERS = [
    "삼송전자", "선우테크", "네오볼트전자",      # 전자
    "마이크로하드", "소현소프트", "클라우드핀 IT", # IT
    "재웅바이오", "상은메디랩", "루미젠바이오",    # 바이오
    "진호파이낸스", "오리온자산운용", "예진캐피탈" # 금융
]

# 2. 각 기업의 상장 시초가 설정 (원하시는 금액으로 조정 가능합니다)
INITIAL_PRICES = {
    "삼송전자": 172000,
    "선우테크": 45000,
    "네오볼트전자": 28000,
    "마이크로하드": 580000,
    "소현소프트": 62000,
    "클라우드핀 IT": 34000,
    "재웅바이오": 89000,
    "상은메디랩": 54000,
    "루미젠바이오": 41000,
    "진호파이낸스": 22000,
    "오리온자산운용": 115000,
    "예진캐피탈": 198000
}

COMPANY_CATEGORIES = {
    "삼송전자": "전자", "선우테크": "전자", "네오볼트전자": "전자",
    "마이크로하드": "IT", "소현소프트": "IT", "클라우드핀 IT": "IT",
    "재웅바이오": "바이오", "상은메디랩": "바이오", "루미젠바이오": "바이오",
    "진호파이낸스": "금융", "오리온자산운용": "금융", "예진캐피탈": "금융"
}

# 🏆 [랭킹 점수판] 
hot_scores = {ticker: 0 for ticker in TARGET_TICKERS}

# 엔진 초기화
engine = MarketEngine()

# 초기 데이터 (전역 변수 - 종목별 관리)
current_news_display = "장 시작 준비 중..."
price_history = {ticker: [] for ticker in TARGET_TICKERS}
current_mentor_comments = {ticker: [] for ticker in TARGET_TICKERS}
news_history_storage = []


# 시뮬레이션 엔진
async def simulate_market_background():
    global current_news_display, price_history, current_mentor_comments
    
    print("🚀 [시스템] 마켓 엔진 재가동 (가격 변동 ON / 자동 체결 OFF)")
    
    # 1. DB 연결
    db = await aiosqlite.connect("stock_game.db", timeout=30.0)
    await db.execute("PRAGMA journal_mode=WAL;") 
    db.row_factory = aiosqlite.Row

    try:
        for ticker in TARGET_TICKERS:
            cursor = await db.execute("SELECT * FROM stocks WHERE company_name = ?", (ticker,))
            row = await cursor.fetchone()
            
            if row:
                start_price = row['current_price']
            else:
                start_price = INITIAL_PRICES.get(ticker, 10000)
                await db.execute("INSERT OR IGNORE INTO stocks (symbol, company_name, current_price) VALUES (?, ?, ?)", 
                                    (ticker, ticker, start_price))
            
            # 엔진 메모리에 등록
            if ticker not in engine.companies:
                from models.domain_models import Company
                sector = COMPANY_CATEGORIES.get(ticker, "기타")
                
                new_comp = Company(
                    ticker=ticker, 
                    name=ticker, 
                    sector=sector,
                    description=f"{ticker} 종목입니다.", 
                    current_price=float(start_price), 
                    total_shares=1000000,
                    change_rate=0.0
                )
                engine.companies[ticker] = new_comp
                engine.order_books[ticker] = {"BUY": [], "SELL": []}

        await db.commit()
        print("✅ [시스템] 모든 종목 등록 완료!")

        # 2. 시초가 저장 (등락률 계산용)
        start_prices = {} 
        for ticker, info in engine.companies.items():
            start_prices[ticker] = info.current_price

        # 3. [무한 루프] 이제 장을 시작합니다!
        loop_count = 0
        while True:
            await asyncio.sleep(1) 
            loop_count += 1
            
            # A. 등락률(Change Rate) 실시간 계산
            for ticker in engine.companies:
                current_price = engine.companies[ticker].current_price
                start_price = start_prices.get(ticker, current_price)
                
                if start_price > 0:
                    change_rate = ((current_price - start_price) / start_price) * 100
                    engine.companies[ticker].change_rate = round(change_rate, 2)

            # B. 뉴스 로테이션
            # if loop_count % 30 == 0:
            #     target_ticker = random.choice(TARGET_TICKERS)
            
            #     # 뉴스 템플릿 (상승/하락/일반)
            #     news_templates = [
            #         f"{target_ticker}, 차세대 핵심 기술 개발 성공 소식에 '강세'",
            #         f"외국인, {target_ticker} 10일 연속 순매수... 주가 기대감↑",
            #         f"{target_ticker}, 경쟁 심화 우려에 주가 소폭 하락세",
            #         f"{target_ticker} 경영진, 자사주 매입 발표... 주주가치 제고",
            #         f"[특징주] {target_ticker}, 3분기 실적 어닝 서프라이즈 달성",
            #         f"{target_ticker}, 글로벌 파트너사와 대규모 공급 계약 체결"
            #     ]
                
            #     news_templates = [
            #         f"{target_ticker}, 차세대 핵심 기술 개발 성공",
            #         f"외국인, {target_ticker} 10일 연속 순매수 행진",
            #         f"{target_ticker}, 경쟁 심화 우려에 주가 숨고르기",
            #         f"{target_ticker} 경영진, 주주가치 제고 위해 자사주 매입",
            #         f"[특징주] {target_ticker}, 3분기 실적 호조 예상",
            #         f"{target_ticker}, 글로벌 기업과 대규모 공급 계약 체결"
            #     ]
            #     title = random.choice(news_templates)
            #     source = "Stocky News"
            #     time_str = datetime.now().strftime("%m.%d %H:%M")

            #     await db.execute("""
            #         INSERT INTO news (ticker, title, source, created_at)
            #         VALUES (?, ?, ?, ?)
            #     """, (target_ticker, title, source, time_str))
                
            #     await db.commit()
            #     print(f"📰 [DB 저장] {title}")

            # C. 주가 변동 (랜덤 워크)
            for ticker in TARGET_TICKERS:
                if ticker not in engine.companies: continue
                
                current_p = engine.companies[ticker].current_price
                spread = random.randint(-500, 500) 
                order_price = int(current_p + spread)
                if order_price < 10: order_price = 10
                
                # 엔진 & DB 업데이트
                engine.companies[ticker].current_price = order_price
                if ticker in hot_scores: hot_scores[ticker] += 1
                
                if order_price != current_p:
                    await db.execute("UPDATE stocks SET current_price = ? WHERE company_name = ?", (order_price, ticker))
                    await db.commit()

                # 히스토리 저장
                price_history[ticker].append({"time": datetime.now().strftime("%H:%M:%S"), "price": order_price})
                if len(price_history[ticker]) > 30: price_history[ticker].pop(0)

            # D. 대기 주문(PENDING) 체결 처리
            async with db.execute("SELECT * FROM orders WHERE status = 'PENDING'") as cursor:
                pending_orders = await cursor.fetchall()

            for db_order in pending_orders:
                o_id = db_order['id']
                user_id = db_order['user_id']
                ticker = db_order['company_name']
                side = db_order['order_type']
                price = db_order['price']
                qty = db_order['quantity']
                
                if ticker not in engine.companies: continue
                current_market_price = engine.companies[ticker].current_price

                # 체결 조건 확인
                is_match = False
                if side == "BUY" and current_market_price <= price: # 싸게 나오면 산다
                    is_match = True
                elif side == "SELL" and current_market_price >= price: # 비싸게 나오면 판다
                    is_match = True
                
                if is_match:
                        await db.execute("UPDATE orders SET status = 'FILLED' WHERE id = ?", (o_id,))
                        
                        if side == "BUY":
                            await db.execute("""
                                INSERT INTO holdings (user_id, company_name, quantity, average_price) 
                                VALUES (?, ?, ?, ?) 
                                ON CONFLICT(user_id, company_name) 
                                DO UPDATE SET quantity = quantity + ?, average_price = (average_price * quantity + ? * ?) / (quantity + ?)
                            """, (user_id, ticker, qty, price, qty, price, qty, qty))
                            
                        elif side == "SELL":
                            income = price * qty
                            await db.execute("UPDATE users SET balance = balance + ? WHERE id = ?", (income, user_id))

                        print(f"🎉 [엔진 체결] {ticker} {qty}주 {side} 완료! (ID: {o_id})")

    except Exception as e:
        print(f"❌ 엔진 에러: {e}")
    finally:
        await db.close()

# [FastAPI 앱 설정]
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    task = asyncio.create_task(simulate_market_background())
    yield
    #task.cancel()

app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:3000",    # React 기본 주소
    "http://127.0.0.1:3000",
    "http://localhost:5173",    # Vite/Next.js 기본 주소
]

# 2. 미들웨어를 설정합니다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trade.router)
app.include_router(social.router, prefix="/api/social", tags=["Social & Ranking"])
app.include_router(news.router)

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
async def get_stock_list():
    """
    [주식 목록 조회]
    12개 기업의 현재가, 등락률, 그리고 '카테고리(sector)' 정보를 반환합니다.
    """
    result = []
    
    for ticker in TARGET_TICKERS:
        # 1. 현재 가격 가져오기 (엔진에 없으면 초기값 사용)
        if ticker in engine.companies:
            current_price = int(engine.companies[ticker].current_price)
        else:
            current_price = INITIAL_PRICES.get(ticker, 10000)
            
        # 2. 등락률 계산
        start_price = INITIAL_PRICES.get(ticker, current_price)
        if start_price == 0:
            change_rate = 0.0
        else:
            change_rate = ((current_price - start_price) / start_price) * 100
            
        # 3. 데이터 조립 (여기서 sector 정보를 정확히 넣어줍니다!)
        result.append({
            "ticker": ticker,
            "name": ticker,
            "sector": COMPANY_CATEGORIES.get(ticker, "기타"), 
            "price": current_price,
            "change_rate": round(change_rate, 2)
        })
        
    return result
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
    
    # price_history에 저장된 데이터를 프론트엔드 형식에 맞춰 반환
    # (time, price 형태의 리스트)
    return price_history.get(ticker, [])

# 3. 호가창 데이터 API (프론트엔드 fetchOrderBook 대응)
@app.get("/api/stocks/{ticker}/orderbook")
async def get_stock_orderbook(ticker: str):
    if ticker not in engine.companies:
        return {"error": "Stock not found"}
    
    comp = engine.companies[ticker]
    book = engine.order_books.get(ticker, {"BUY": [], "SELL": []})
    
    return {
        "ticker": ticker,
        "current_price": int(comp.current_price),
        "asks": book.get("SELL", [
            {"price": int(comp.current_price + 100), "volume": 10},
            {"price": int(comp.current_price + 200), "volume": 50}
        ]),
        "bids": book.get("BUY", [
            {"price": int(comp.current_price - 100), "volume": 20},
            {"price": int(comp.current_price - 200), "volume": 100}
        ])
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
    sorted_ranking = sorted(hot_scores.items(), key=lambda x: x[1], reverse=True)[:12]

    response_data = []
    
    for rank, (ticker_name, score) in enumerate(sorted_ranking, 1):
        
        # A. 실시간 현재가 가져오기 (엔진에서 조회)
        if ticker_name in engine.companies:
            current_price = int(engine.companies[ticker_name].current_price)
        else:
            current_price = INITIAL_PRICES.get(ticker_name, 0)

        # B. 시작 가격 가져오기 (등락률 계산용)
        initial_price = INITIAL_PRICES.get(ticker_name, current_price)

        # C. 등락률(Change Rate) 계산
        if initial_price == 0:
            change_rate = 0.0
        else:
            change_rate = ((current_price - initial_price) / initial_price) * 100
        
        # D. 데이터 조립
        response_data.append({
            "rank": rank,
            "ticker": ticker_name,
            "name": ticker_name,
            "score": score,
            "current_price": current_price,
            "change_rate": round(change_rate, 2)
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