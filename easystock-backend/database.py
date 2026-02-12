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

        # user_quests 테이블에 is_completed가 없다면 추가
        try: 
            await db.execute("ALTER TABLE user_quests ADD COLUMN is_completed INTEGER DEFAULT 1") 
            print("✅ DB 업데이트: 'is_completed' 컬럼 추가됨")
        except: 
            pass

        try: 
            # 혹시 quest_name으로 만들어진 경우를 대비해 quest_id로 통일하거나 별칭 처리
            # (여기서는 일단 컬럼 추가만 확실하게 합니다)
            pass
        except: pass
        
        # ... (나머지 테이블 생성 코드는 그대로 두세요: holdings, orders 등) ...
        # [기존 코드 유지]
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
            published_at TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        # 2) 테이블은 있는데 컬럼이 없을 수도 있으니, 하나씩 추가를 시도합니다.
        # (이미 있으면 에러가 나므로 try-except로 감싸서 무시합니다)

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

        # 9. 초기 데이터 (없으면 삼성전자/SK하이닉스 추가)
        cursor = await db.execute("SELECT count(*) FROM stocks")
        if (await cursor.fetchone())[0] == 0:
            print("⚙️ 초기 주식 데이터 생성 중...")
            await db.execute("INSERT INTO stocks (symbol, company_name, current_price) VALUES (?, ?, ?)", 
                            ("삼성전자", "삼성전자", 70000))
            await db.execute("INSERT INTO stocks (symbol, company_name, current_price) VALUES (?, ?, ?)", 
                            ("SK하이닉스", "SK하이닉스", 120000))
        
        await db.commit()
        print("✅ DB 초기화 및 WAL 모드 설정 완료!")

if __name__ == "__main__":
    asyncio.run(init_db())