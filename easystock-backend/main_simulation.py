import asyncio
import logging
import random
from datetime import datetime, timedelta 
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from database import SessionLocal, DBAgent, DBNews, DBCompany, DBTrade, DBDiscussion
from core.team_market_engine import MarketEngine
from community_manager import post_comment 
from models.domain_models import Order, OrderSide, OrderType, AgentState
from core.agent_society_brain import agent_society_think

# ------------------------------------------------------------------
# 0. 로깅 및 엔진 설정
# ------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S")
logger = logging.getLogger("GlobalMarket")

# 화면을 도배하는 통신 로그 강제 음소거
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)

market_engine = MarketEngine()

running = True # 🟢 서버 실행 상태 플래그

# ------------------------------------------------------------------
# 시뮬레이션 시작 시간 (DB에서 마지막 시간을 찾아 이어달리기)
# ------------------------------------------------------------------
def get_latest_sim_time():
    with SessionLocal() as db:
        last_trade = db.query(DBTrade).order_by(desc(DBTrade.timestamp)).first()
        if last_trade and last_trade.timestamp:
            # 마지막 거래가 있다면 그 시간으로 세팅 (루프 돌면서 +1분 됨)
            return last_trade.timestamp
        # 만약 DB가 텅 비어있는 완전 초기 상태라면 오늘 09시로 시작
        return datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)

current_sim_time = get_latest_sim_time()

# ------------------------------------------------------------------
# 1. 마켓 메이커 (Market Maker)
# ------------------------------------------------------------------
def run_global_market_maker(db: Session, all_tickers: list, sim_time: datetime):
    mm_id = "MARKET_MAKER"
    mm_agent = db.query(DBAgent).filter(DBAgent.agent_id == mm_id).first()
    
    if not mm_agent:
        initial_portfolio = {ticker: 1000000 for ticker in all_tickers}
        mm_agent = DBAgent(agent_id=mm_id, cash_balance=1e15, portfolio=initial_portfolio, psychology={})
        db.add(mm_agent)
        db.commit()

    for ticker in all_tickers:
        company = db.query(DBCompany).filter(DBCompany.ticker == ticker).first()
        if not company: continue

        curr_price = int(company.current_price)
        
        # 💡 [핵심 수정] 1개만 걸던 주문을 반복문을 통해 5개로 늘려 5호가를 만듭니다!
        for step in range(1, 6):
            # step이 커질수록 현재가에서 더 멀리 떨어진 가격(0.15% 간격)으로 호가를 만듭니다.
            spread = max(1, int(curr_price * 0.0015 * step)) 
            # 각 층마다 수량도 30주~250주 사이로 리얼하게 랜덤으로 깝니다.
            qty_buy = random.randint(30, 250)
            qty_sell = random.randint(30, 250)

            try:
                # 매수 호가 (현재가보다 싼 가격들: 1층, 2층... 5층)
                market_engine.place_order(db, Order(agent_id=mm_id, ticker=ticker, side=OrderSide.BUY, order_type=OrderType.LIMIT, quantity=qty_buy, price=curr_price - spread), sim_time)
                # 매도 호가 (현재가보다 비싼 가격들: 1층, 2층... 5층)
                market_engine.place_order(db, Order(agent_id=mm_id, ticker=ticker, side=OrderSide.SELL, order_type=OrderType.LIMIT, quantity=qty_sell, price=curr_price + spread), sim_time)
            except: 
                pass

# ------------------------------------------------------------------
# [Helper] 추세 분석
# ------------------------------------------------------------------
def analyze_market_trend(db: Session, ticker: str):
    trades = db.query(DBTrade).filter(DBTrade.ticker == ticker).order_by(desc(DBTrade.timestamp)).limit(20).all()
    if not trades: return "정보 없음 (탐색 단계)"
    
    start_p = trades[-1].price
    end_p = trades[0].price
    
    if end_p > start_p * 1.02: return "🔥 급등세 (매수세 강함)"
    elif end_p > start_p: return "📈 완만한 상승"
    elif end_p < start_p * 0.98: return "😱 급락세 (투매 발생)"
    elif end_p < start_p: return "📉 하락세"
    else: return "⚖️ 보합세 (눈치보기)"

# ------------------------------------------------------------------
# 2. 에이전트 거래 실행
# ------------------------------------------------------------------
async def run_agent_trade(agent_id: str, ticker: str, sim_time: datetime):
    with SessionLocal() as db:
        try:
            agent = db.query(DBAgent).filter(DBAgent.agent_id == agent_id).first()
            company = db.query(DBCompany).filter(DBCompany.ticker == ticker).first()
            if not agent or not company: return

            # 💡 [추적 1] 봇이 어떤 종목을 골랐는지 확인
            # logger.info(f"🔎 [추적 1] {agent_id}가 {ticker} 매매 준비 중...")

            news_obj = db.query(DBNews).filter(DBNews.company_name == company.name).order_by(desc(DBNews.id)).first()
            news_text = news_obj.title if news_obj else "특이사항 없음"
            trend_info = analyze_market_trend(db, ticker)

            portfolio_qty = agent.portfolio.get(ticker, 0)
            avg_price = agent.psychology.get(f"avg_price_{ticker}", 0)
            if portfolio_qty > 0 and avg_price == 0: avg_price = company.current_price
            last_thought = agent.psychology.get(f"last_thought_{ticker}", None)

            try:
                decision = await agent_society_think(
                    agent_name=agent.agent_id, 
                    agent_state=AgentState(**agent.psychology),
                    context_info=news_text, 
                    current_price=company.current_price, 
                    cash=agent.cash_balance,
                    portfolio_qty=portfolio_qty,
                    avg_price=avg_price,
                    last_action_desc=last_thought,
                    market_sentiment=trend_info
                )
                # logger.info(f"🔎 [추적 2] {agent_id} 정상적으로 생각 완료!")
            except Exception as e:
                logger.error(f"🚨 [에러 발생] AI 생각 실패 ({agent_id}): {e}")
                decision = {
                    "action": random.choice(["BUY", "SELL"]),
                    "quantity": random.randint(10, 50),
                    "price": company.current_price,
                    "thought_process": "강제 매매"
                }
                # logger.info(f"🔎 [추적 2] {agent_id} 강제 뇌동매매 발동!")

            action = str(decision.get("action", "HOLD")).upper()

            try:
                qty_raw = decision.get("quantity", 0)
                qty = int(float(qty_raw)) if qty_raw not in [None, "None", "null", ""] else 0
            except:
                qty = 0

            # 🚀 [강력한 뉴스 반응 엔진 (News Impact Engine) 탑재!]
            good_keywords = ["호재", "상승", "돌파", "계약", "성공", "출시", "인수", "흑자", "성장", "수주", "개발", "혁신", "M&A", "체결"]
            bad_keywords = ["악재", "하락", "쇼크", "횡령", "소송", "결함", "위반", "붕괴", "적자", "포기", "실패", "우려", "매각", "논란"]

            is_good_news = any(kw in news_text for kw in good_keywords)
            is_bad_news = any(kw in news_text for kw in bad_keywords)
            
            impact_multiplier = 1
            if news_obj and hasattr(news_obj, 'impact_score') and news_obj.impact_score:
                if int(news_obj.impact_score) >= 80: 
                    impact_multiplier = 10  
                elif int(news_obj.impact_score) >= 60: 
                    impact_multiplier = 5   

            if is_good_news:
                action = "BUY"
                qty = random.randint(50, 100) * impact_multiplier
                is_market_order = True
                thought = f"미쳤다! '{news_text}' 떴네! 이건 무조건 풀매수 가즈아!!!"
            elif is_bad_news:
                action = "SELL"
                qty = random.randint(50, 100) * impact_multiplier
                is_market_order = True
                thought = f"헐... '{news_text}' 실화냐? 당장 다 던져라 돔황챠!!!"
            else:
                if action == "HOLD": action = random.choice(["BUY", "SELL"])
                if qty <= 0: qty = random.randint(10, 30)
                is_market_order = True
                thought = str(decision.get("thought_process", "차트 보고 매매합니다."))

            try:
                price_raw = decision.get("price", company.current_price)
                ai_target_price = int(float(price_raw)) if price_raw not in [None, "None", "null", ""] else int(company.current_price)
            except:
                ai_target_price = int(company.current_price)

            curr_p = company.current_price
            final_price = ai_target_price
            
            # 💡 [여기 추가!] 1. AI가 눈치보며 "HOLD"를 선택하면, 강제로 BUY나 SELL로 바꿔버립니다!
            if action == "HOLD":
                action = random.choice(["BUY", "SELL"])
            
            try:
                qty_raw = decision.get("quantity", 0)
                qty = int(float(qty_raw)) if qty_raw not in [None, "None", "null", ""] else 0
            except:
                qty = 0
            
            # 💡 [여기 추가!] 혹시 수량이 0이면 무조건 10~50주 거래하게 만듭니다.
            if qty <= 0:
                qty = random.randint(10, 50)
            
            try:
                price_raw = decision.get("price", company.current_price)
                ai_target_price = int(float(price_raw)) if price_raw not in [None, "None", "null", ""] else int(company.current_price)
            except:
                ai_target_price = int(company.current_price)

            # 💡 [여기 수정!] 2. 지정가 눈치싸움을 없애고 무조건 마켓메이커의 벽을 부수는 '시장가'로 돌격시킵니다!
            is_market_order = True # (기존: random.random() < 0.7 지우고 True로 고정)
            
            curr_p = company.current_price
            final_price = ai_target_price

            if action == "BUY":
                final_price = int(curr_p * 1.02) if is_market_order else min(ai_target_price, int(curr_p * 0.99))
            elif action == "SELL":
                final_price = int(curr_p * 0.98) if is_market_order else max(ai_target_price, int(curr_p * 1.01))

            # 💡 [추적 3] 봇이 최종적으로 어떤 주문을 넣으려는지 확인
            # logger.info(f"🔎 [추적 3] {agent_id} -> {action} {qty}주 (가격: {final_price}) 주문 전송 중...")

            if action in ["BUY", "SELL"] and qty > 0:
                side = OrderSide.BUY if action == "BUY" else OrderSide.SELL
                order = Order(agent_id=agent.agent_id, ticker=ticker, side=side, order_type=OrderType.LIMIT, quantity=qty, price=final_price)
                result = market_engine.place_order(db, order, sim_time=sim_time)
                
                if result['status'] == 'SUCCESS':
                    #logger.info(f"⚡ {ticker} 체결! | {agent_id} | {action} {qty}주")
                    try:
                        post_comment(db, agent_id, ticker, action, company.name, sim_time=sim_time)
                    except: pass
                    
                    # 💡 [무적의 등락률 계산기 장착!] 
                    latest_trade = db.query(DBTrade).filter(DBTrade.ticker == ticker).order_by(desc(DBTrade.timestamp)).first()
                    if latest_trade:
                        company.current_price = latest_trade.price
                        
                        # 과거 DB 데이터 꼬임을 방지하기 위해 기획된 가격을 직접 기준으로 삼습니다.
                        BASE_PRICES = {
                            "SS011": 172000, "JW004": 45000, "AT010": 28000, "MH012": 580000,
                            "SH001": 62000, "ND008": 34000, "JH005": 89000, "SE002": 54000,
                            "IA009": 41000, "SW006": 22000, "QD007": 115000, "YJ003": 198000
                        }
                        base_price = BASE_PRICES.get(ticker, latest_trade.price)
                        
                        if base_price > 0:
                            company.change_rate = ((latest_trade.price - base_price) / base_price) * 100
                            
                        db.commit()
                        #logger.info(f"📈 [간판 교체] {company.name}: {company.current_price}원 ({company.change_rate:.2f}%)")
                        
        except Exception as e:
            logger.error(f"🚨 트레이드 전체 에러 발생: {e}")
# ------------------------------------------------------------------
# 🔥 3. 글로벌 라운지 (커뮤니티) - DB 락 방지 추가
# ------------------------------------------------------------------
async def run_global_chatter(agent_id: str, sim_time: datetime):
    # 매매하는 다른 30명의 에이전트들과 DB 충돌이 나지 않도록 약간의 엇박자 딜레이를 줍니다.
    await asyncio.sleep(random.uniform(0.5, 2.0))
    
    with SessionLocal() as db:
        try:
            agent = db.query(DBAgent).filter(DBAgent.agent_id == agent_id).first()
            if not agent: return
            
            port_summary = ", ".join([f"{k} {v}주" for k, v in agent.portfolio.items()]) or "보유 주식 없음"
            
            context_prompt = (
                f"현재 당신의 계좌 상태 - 잔고: {agent.cash_balance}원, 보유주식: {port_summary}. "
                "당신은 방금 주식 시장을 확인하고 투자자 커뮤니티 라운지에 접속했습니다. "
                "당신의 성향과 현재 계좌 상태를 바탕으로, 지금 느끼는 감정이나 시장에 대한 생각을 자연스러운 커뮤니티 게시글(1문장)로 작성하세요. "
                "반드시 아래 JSON 형식으로 응답해야 시스템이 인식합니다:\n"
                '{"action": "HOLD", "quantity": 0, "price": 0, "thought_process": "게시글 내용"}'
            )
            
            decision = await agent_society_think(
                agent_name=agent.agent_id, 
                agent_state=AgentState(**agent.psychology),
                context_info=context_prompt, 
                current_price=0, 
                cash=agent.cash_balance,
                portfolio_qty=0,
                avg_price=0,
                last_action_desc="커뮤니티에서 다른 사람들의 반응을 지켜보는 중",
                market_sentiment="자유게시판 (수다 떠는 곳)"
            )
            
            chatter = decision.get("thought_process", "")
            
            if not chatter or chatter == "생각 없음" or chatter.lower() in ["none", "null"]: 
                logger.warning(f"⚠️ [커뮤니티] {agent_id}가 글 작성을 포기했습니다. (AI 응답 오류 의심)")
                return
            
            bull_keywords = ["가즈아", "수익", "풀매수", "달달", "떡상", "기회", "반등", "샀", "오른다"]
            sentiment = "BULL" if any(w in chatter for w in bull_keywords) else "BEAR"
            
            new_post = DBDiscussion(
                ticker="GLOBAL",
                agent_id=agent.agent_id,
                content=chatter,
                sentiment=sentiment,
                created_at=sim_time
            )
            db.add(new_post)
            db.commit()
            
            logger.info(f"💬 [시장 라운지] {agent_id}: {chatter}")
            
        except Exception as e:
            logger.error(f"❌ [시장 라운지 에러] {agent_id} 글쓰기 실패: {e}")

# ------------------------------------------------------------------
# 4. 메인 시뮬레이션 루프
# ------------------------------------------------------------------
async def run_simulation_loop():
    global current_sim_time
    logger.info(f"🚀 [Time Warp] 시뮬레이션 가동! 시작 시간: {current_sim_time.strftime('%H:%M')}")
    
    while True:
        try:
            current_sim_time += timedelta(minutes=1)
            
            if current_sim_time.minute == 0:
                logger.info(f"⏰ 현재 가상 시간: {current_sim_time.strftime('%H:%M')}")

            # 💡 [여기서부터 수정] 시간 계산 대신 "마켓메이커"의 주문만 콕 집어서 삭제합니다.
            for ticker, book in market_engine.order_books.items():
                # AI의 주문은 살려두고, 마켓 메이커의 거대한 벽만 매 턴마다 허물어줍니다.
                book["BUY"] = [o for o in book["BUY"] if o["agent_id"] != "MARKET_MAKER"]
                book["SELL"] = [o for o in book["SELL"] if o["agent_id"] != "MARKET_MAKER"]
            # 💡 [여기까지 수정 완료]

            # 현실 10분마다 하루가 지나도록 설정 (19시 마감)
            if current_sim_time.hour >= 19:
                 logger.info("🌙 장 마감! 다음날 아침으로 점프합니다.")
                 current_sim_time += timedelta(days=1)
                 current_sim_time = current_sim_time.replace(hour=9, minute=0)
            
            with SessionLocal() as db:
                all_companies = db.query(DBCompany).all()
                all_tickers = [c.ticker for c in all_companies] 
                
                run_global_market_maker(db, all_tickers, current_sim_time)
                all_agents = [a.agent_id for a in db.query(DBAgent.agent_id).all() if a.agent_id != "MARKET_MAKER"]

            # 💡 1번 수정: 한 턴에 움직이는 봇의 수를 30명 -> 5명으로 줄입니다. (서버 부하 1/6로 감소!)
            active_agents = random.sample(all_agents, k=30) if len(all_agents) > 40 else all_agents
            
            tasks = []
            
            for agent_id in active_agents:
                my_ticker = random.choice(all_tickers) 
                tasks.append(run_agent_trade(agent_id, my_ticker, current_sim_time))
            
            if active_agents and random.random() < 0.3:
                chatty_agent = random.choice(active_agents)
                tasks.append(run_global_chatter(chatty_agent, current_sim_time))
            
            await asyncio.gather(*tasks) 
            
            # 💡 2번 수정: 1초마다 돌던 루프를 3초~5초마다 돌도록 휴식 시간을 줍니다.
            await asyncio.sleep(1)

        except Exception as e:
            logger.error(f"🚨 메인 루프 치명적 에러: {e}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(run_simulation_loop())