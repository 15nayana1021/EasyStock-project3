from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import asyncio
import random
from datetime import datetime
import aiosqlite
from pydantic import BaseModel


# 엔진과 모델 임포트

from database import init_db
from routers import trade, social, news
from core.market_engine import MarketEngine  # 진짜 엔진
from models.domain_models import Order, OrderType, OrderSide, Agent # 주문 모델


# [전역 설정]
TARGET_TICKERS = ["삼성전자", "소현컴퍼니", "상은테크놀로지", "예진캐피탈"]

INITIAL_PRICES = {
    "삼성전자": 178500,
    "소현컴퍼니": 60000,
    "상은테크놀로지": 50000,
    "예진캐피탈": 115000
}

# 🏆 [랭킹 점수판] 
hot_scores = {ticker: 0 for ticker in TARGET_TICKERS}

# 엔진 초기화
engine = MarketEngine()

# 초기 데이터 (전역 변수 - 종목별 관리)
current_news_display = "장 시작 준비 중..."
price_history = {ticker: [] for ticker in TARGET_TICKERS}
current_mentor_comments = {ticker: [] for ticker in TARGET_TICKERS}


# [시뮬레이션 엔진] - 봇 활동 + 사용자 주문 체결 처리(청산)
async def simulate_market_background():
    global current_news_display, price_history, current_mentor_comments
    
    print("🚀 리얼 마켓 엔진 & 청산 시스템 가동!")
    
    # [Step 0] 멘토단 결성
    real_ai_mode = False 
    try:
        from core.mentor_personas import MENTOR_PROFILES
        real_ai_mode = True 
        print(f"✅ Real AI 모드 활성화!")
    except Exception as e:
        print(f"⚠️ [경고] AI 설정 실패: {e}")

    loop_count = 0
    
    # DB 연결 (WAL 모드)
    db = await aiosqlite.connect("stock_game.db", timeout=30.0)
    await db.execute("PRAGMA journal_mode=WAL;") 
    db.row_factory = aiosqlite.Row 

    try:
        
        
        for ticker in TARGET_TICKERS:
            # DB 가격 동기화
            cursor = await db.execute("SELECT * FROM stocks WHERE company_name = ?", (ticker,))
            row = await cursor.fetchone()
            
            
            if row:
                start_price = row['current_price']
            else:
                start_price = INITIAL_PRICES.get(ticker, 10000)

            if not row:
                await db.execute("INSERT OR IGNORE INTO stocks (symbol, company_name, current_price) VALUES (?, ?, ?)", 
                                    (ticker, ticker, start_price))
            
            # 엔진 등록
            if ticker not in engine.companies:
                from models.domain_models import Company
                new_comp = Company(ticker=ticker, name=ticker, sector="Tech", description="Custom", current_price=float(start_price), total_shares=1000000)
                engine.companies[ticker] = new_comp
                engine.order_books[ticker] = {"BUY": [], "SELL": []}
                print(f"⚙️ 엔진 등록: {ticker}")

        await db.commit()

        # [무한 루프] 봇 주문 + 사용자 체결 확인
        while True:
            await asyncio.sleep(1) 
            loop_count += 1
            
            # 뉴스 로테이션
            if loop_count % 10 == 0:
                events = ["반도체 수요 폭발", "금리 동결 발표", "경쟁사 실적 부진", "특별한 이슈 없음", "신제품 출시 임박"]
                current_news_display = random.choice(events)

            for ticker in TARGET_TICKERS:
                if ticker not in engine.companies: continue
                
                # 1. 봇(Bot)의 랜덤 주문 투입
                current_p = engine.companies[ticker].current_price
                bot_side = random.choice([OrderSide.BUY, OrderSide.SELL])
                spread = random.randint(-500, 500)
                order_price = int(current_p + spread)
                if order_price < 10: order_price = 10
                qty = random.randint(1, 5)

                bot_order = Order(
                    agent_id="Bot_Noise", ticker=ticker, side=bot_side,
                    order_type=OrderType.LIMIT, quantity=qty, price=order_price
                )
                engine.place_order(bot_order)

                if ticker in hot_scores:
                    hot_scores[ticker] += 1
                
                # 2. 가격 변동 DB 반영
                new_price = int(engine.companies[ticker].current_price)
                if new_price != current_p:
                    await db.execute("UPDATE stocks SET current_price = ? WHERE company_name = ?", (new_price, ticker))
                    await db.commit()
                    # 봇 체결 알림 (너무 많으면 주석 처리)
                    # print(f"✨ [시장] {ticker} 현재가 {new_price}원으로 변경")

                # 히스토리 저장
                price_history[ticker].append({"time": datetime.now().strftime("%H:%M:%S"), "price": new_price})
                if len(price_history[ticker]) > 30: price_history[ticker].pop(0)

                # 3. 멘토링 (삼성전자만 Real AI)
                if real_ai_mode and ticker == "삼성전자" and (loop_count % 30 == 0):
                    pass 
                elif (loop_count % 5 == 0):
                    # 무료 멘트
                    comments_pool = [{"n": "시스템", "c": "거래량 분석 중...", "s": "value-box"}, {"n": "알림", "c": "변동성 확대 주의", "s": "momentum-box"}]
                    if ticker != "삼성전자" or not current_mentor_comments[ticker]:
                        current_mentor_comments[ticker] = random.sample(comments_pool, 1)

            
            # 사용자 주문 정산       
            async with db.execute("SELECT * FROM orders WHERE status = 'PENDING'") as cursor:
                pending_orders = await cursor.fetchall()

            for db_order in pending_orders:
                order_id = db_order['id']
                user_id = db_order['user_id']
                target_ticker = db_order['company_name']
                o_type = db_order['order_type'] # 'BUY' or 'SELL'
                qty = db_order['quantity']
                price = db_order['price']
                
                # 엔진에서 내 주문 찾기
                is_alive_in_engine = False
                book = engine.order_books.get(target_ticker, {"BUY": [], "SELL": []})
                
                # 매수 주문이면 BUY 쪽, 매도면 SELL 쪽 확인
                check_list = book["BUY"] if o_type == "BUY" else book["SELL"]
                
                for eng_order in check_list:
                    if eng_order.agent_id == f"User_{user_id}" and eng_order.price == price:
                        # 아직 호가창에 남아있음 -> 체결 안 됨
                        is_alive_in_engine = True
                        break
                
                # 호가창에서 사라졌다? = 체결 완료 (FILLED)!
                if not is_alive_in_engine:
                    print(f"🎉 [체결 성공] 사용자 {user_id}님의 {target_ticker} 주문이 체결되었습니다!")

                    if target_ticker in hot_scores:
                        before_score = hot_scores[target_ticker] # 오르기 전 점수 기억
                        hot_scores[target_ticker] += 50
                        
                        print(f"🚀 [떡상] '{target_ticker}' 유저 거래 발생! 점수 폭등: {before_score} -> {hot_scores[target_ticker]} (+50)")
                    
                    # 1. 주문 상태 변경
                    await db.execute("UPDATE orders SET status = 'FILLED' WHERE id = ?", (order_id,))
                    
                    # 2. 자산 지급 (Step 3에서 이미 차감했으므로, 들어올 것만 주면 됨)
                    if o_type == "BUY":
                        # 매수 성공: 주식 지급
                        await db.execute("""
                            INSERT INTO holdings (user_id, company_name, quantity, average_price)
                            VALUES (?, ?, ?, ?)
                            ON CONFLICT(user_id, company_name) DO UPDATE SET quantity = quantity + ?, average_price = ?
                        """, (user_id, target_ticker, qty, price, qty, price))
                        
                    elif o_type == "SELL":
                        # 매도 성공: 현금 지급
                        income = price * qty
                        await db.execute("UPDATE users SET balance = balance + ? WHERE id = ?", (income, user_id))

                    # 3. 퀘스트 자동 달성 (보너스 + 경험치 지급)
                    quest_name = "첫 매수 성공" if o_type == "BUY" else "첫 매도 성공"
                    
                    # quest_id 컬럼명을 명확하게 사용
                    cursor = await db.execute("SELECT count(*) FROM user_quests WHERE user_id = ? AND quest_id = ?", (user_id, quest_name))
                    
                    if (await cursor.fetchone())[0] == 0:
                            reward_cash = 500000 if o_type == "BUY" else 1000000
                            
                            await db.execute("""
                            INSERT INTO user_quests (user_id, quest_id, reward_amount, is_completed, completed_at) 
                            VALUES (?, ?, ?, 1, datetime('now'))
                            """, (user_id, quest_name, reward_cash))
                            
                            await db.execute("UPDATE users SET balance = balance + ? WHERE id = ?", (reward_cash, user_id))
                            print(f"🎁 [퀘스트 완료] {quest_name}! 보상금 {reward_cash}원 지급")

                            # (경험치 지급 로직 유지)
                            try:
                                from services.gamification import gain_exp
                                xp_reward = 100 
                                await gain_exp(user_id, xp_reward, db=db) 
                                print(f"🆙 [성장] 퀘스트 보상으로 경험치 +{xp_reward} 획득!")
                            except Exception as e:
                                print(f"⚠️ [에러] 경험치 지급 중 문제 발생: {e}")

                    await db.commit()

    except Exception as e:
        print(f"❌ 시뮬레이션 치명적 에러: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await db.close()

# [FastAPI 앱 설정]
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    task = asyncio.create_task(simulate_market_background())
    yield
    task.cancel()

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
app.include_router(news.router, prefix="/api/news", tags=["News"])

@app.get("/api/market-data")
async def get_market_data(ticker: str = "삼성전자"):
    if ticker in hot_scores:
        hot_scores[ticker] += 0.1
        hot_scores[ticker] = round(hot_scores[ticker], 1)
        
        #print(f"👀 [내 관심] '{ticker}' 조회수 UP! (현재 점수: {hot_scores[ticker]})")

    comp = engine.companies[ticker]
    book = engine.order_books.get(ticker, {"BUY": [], "SELL": []})
    
    # 엔진 호가
    # engine.order_books에 있는 Order 객체들을 딕셔너리로 변환
    buy_orders = [o.dict() for o in book["BUY"][:5]]  # 상위 5개
    sell_orders = [o.dict() for o in book["SELL"][:5]] # 상위 5개

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

@app.get("/stocks")
async def get_stock_list():
    """
    엔진에 있는 모든 종목의 최신 정보를 가져옵니다.
    """
    result = []
    for ticker in TARGET_TICKERS:
        # 엔진에서 실시간 정보 조회
        if ticker in engine.companies:
            comp = engine.companies[ticker]
            result.append({
                "ticker": ticker,
                "name": ticker,
                "sector": "IT/반도체" if ticker == "삼성전자" else "벤처/스타트업",
                "current_price": int(comp.current_price),
                "fluctuation_rate": 0.0
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
        # users 테이블이 없으면 만드는 안전장치
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                balance INTEGER
            )
        """)
        
        # 닉네임이 있으면 무시(IGNORE), 없으면 새로 만들고 100만원(1000000) 지급
        await db.execute("""
            INSERT OR IGNORE INTO users (username, balance) 
            VALUES (?, 1000000)
        """, (request.nickname,))
        
        await db.commit()
        
    return {"success": True, "message": f"Welcome {request.nickname}!"}

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
@app.get("/stocks/{ticker}")
async def get_stock_detail(ticker: str):
    if ticker not in engine.companies:
        return {"error": "Stock not found"}
    
    comp = engine.companies[ticker]
    return {
        "ticker": ticker,
        "name": ticker,
        "sector": "Tech",
        "current_price": int(comp.current_price),
        # 필요한 경우 여기에 차트 데이터나 호가 데이터 추가 가능
    }

@app.get("/api/ranking/hot")
def get_hot_ranking():
    # 1. 랭킹 점수판(hot_scores)을 점수 높은 순으로 정렬
    sorted_ranking = sorted(hot_scores.items(), key=lambda x: x[1], reverse=True)[:5]

    response_data = []
    
    # enumerate(..., 1)을 써서 1위부터 순위를 매깁니다.
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

app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    # access_log=False 옵션이 핵심입니다!
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, access_log=False)