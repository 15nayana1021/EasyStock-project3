import aiosqlite
import asyncio

DB_NAME = "stock_game.db"

async def get_db_connection():
    """FastAPI 라우터에서 쓸 DB 연결 생성기"""
    conn = await aiosqlite.connect(DB_NAME, timeout=30.0)
    conn.row_factory = aiosqlite.Row
    return conn

async def init_db():
    async with aiosqlite.connect(DB_NAME, timeout=30.0) as db:
        await db.execute("PRAGMA journal_mode=WAL;") 
        
        # 1. users 테이블 (기본 생성)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            password TEXT,
            balance INTEGER DEFAULT 1000000,
            level INTEGER DEFAULT 1,
            exp INTEGER DEFAULT 0
        )
        """)
        
        # users 테이블 컬럼 추가
        try: await db.execute("ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1"); 
        except: pass
        try: await db.execute("ALTER TABLE users ADD COLUMN exp INTEGER DEFAULT 0"); 
        except: pass

        
        # 2. user_quests 테이블
        await db.execute("""
        CREATE TABLE IF NOT EXISTS user_quests (
            user_id INTEGER,
            quest_id TEXT,          -- quest_name과 호환되도록 TEXT
            is_completed INTEGER DEFAULT 0, -- 🔥 이 컬럼이 꼭 필요합니다!
            completed_at TEXT,
            reward_amount INTEGER,
            PRIMARY KEY (user_id, quest_id)
        )
        """)

        try: 
            await db.execute("ALTER TABLE user_quests ADD COLUMN is_completed INTEGER DEFAULT 1") 
            print("✅ DB 업데이트: 'is_completed' 컬럼 추가됨")
        except: 
            pass

        try: 
            pass
        except: pass

        await db.execute("""
        CREATE TABLE IF NOT EXISTS holdings (
            user_id INTEGER,
            company_name TEXT,
            quantity INTEGER,
            average_price REAL,
            PRIMARY KEY (user_id, company_name)
        )
        """)

        # 3. 거래 내역 테이블 (Transactions)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            transaction_type TEXT,
            amount INTEGER,
            balance_after INTEGER,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        # 4. 주식 종목 테이블 (Stocks)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS stocks (
            symbol TEXT PRIMARY KEY,
            company_name TEXT,
            current_price INTEGER,
            description TEXT
        )
        """)

        # 5. 뉴스 테이블 (News)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker TEXT,
            title TEXT,
            content TEXT,
            summary TEXT,
            sentiment TEXT,
            impact_score INTEGER,
            source TEXT,
            published_at TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        try:
            await db.execute("ALTER TABLE news ADD COLUMN ticker TEXT")
        except Exception:
            pass

        try:
            await db.execute("ALTER TABLE news ADD COLUMN summary TEXT")
        except Exception:
            pass

        try:
            await db.execute("ALTER TABLE news ADD COLUMN sentiment TEXT")
        except Exception:
            pass

        try:
            await db.execute("ALTER TABLE news ADD COLUMN published_at TEXT")
        except Exception:
            pass

        # 변경사항 저장
        await db.commit()
        print("✅ DB: news 테이블 구조 업데이트 완료 (ticker, summary, sentiment 포함)")
        # 6. 퀘스트 목록 (Quests)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS quests (
            quest_id TEXT PRIMARY KEY,
            title TEXT,
            description TEXT,
            reward_exp INTEGER
        )
        """)

        # 7. 유저 퀘스트 완료 기록 (UserQuests)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS user_quests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            quest_name TEXT,
            status TEXT DEFAULT 'COMPLETED',
            reward_amount INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        # 8. 주문 내역 테이블 (Orders)
        await db.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            company_name TEXT,
            order_type TEXT,      -- BUY / SELL
            price INTEGER,        -- 희망 가격
            quantity INTEGER,     -- 수량
            status TEXT DEFAULT 'PENDING', -- PENDING / FILLED / CANCELLED
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

if __name__ == "__main__":
    asyncio.run(init_db())