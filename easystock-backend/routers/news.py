from fastapi import APIRouter, HTTPException, Depends, Header, Path
import aiosqlite
from database import get_db_connection

try:
    from services.gamification import gain_exp, check_quest
except ImportError:
    async def gain_exp(*args, **kwargs): pass
    async def check_quest(*args, **kwargs): pass

router = APIRouter(prefix="/api/news", tags=["News"])

# 1. 뉴스 목록 조회 (아까 검증된 안전한 코드)
@router.get("")
@router.get("/")
async def get_published_news(db: aiosqlite.Connection = Depends(get_db_connection)):
    try:
        db.row_factory = aiosqlite.Row
        
        query = """
            SELECT * FROM news 
            ORDER BY id DESC 
            LIMIT 20
        """
        
        async with db.execute(query) as cursor:
            rows = await cursor.fetchall()
            result = []
            for row in rows:
                d = dict(row)
                result.append({
                    "id": d.get("id"),
                    "title": d.get("title"),
                    "summary": d.get("summary", ""),
                    "sentiment": d.get("sentiment", "neutral"),
                    "impact_score": d.get("impact_score", 0),
                    "category": d.get("category", "일반"),
                    "source": d.get("source", "알 수 없음"),
                    "published_at": d.get("published_at") or d.get("created_at") or ""
                })
            return result
            
    except Exception as e:
        print(f"❌ 뉴스 목록 조회 에러: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 2. 뉴스 목록 API
@router.get("/news")
async def get_news():
    try:
        db = await aiosqlite.connect("stock-game.db")
        db.row_factory = aiosqlite.Row
        
        query = """
            SELECT id, title, summary, sentiment, category, source, published_at 
            FROM news 
            ORDER BY id DESC LIMIT 20
        """
        cursor = await db.execute(query)
        rows = await cursor.fetchall()
        await db.close()

        result = []
        for d in rows:
            result.append({
                "id": d["id"],
                "title": d["title"],
                "summary": d["summary"],
                "sentiment": d["sentiment"],
                "category": d["category"] if d.get("category") else "일반",
                "source": d["source"] if d.get("source") else "Stocky News",
                "published_at": d["published_at"]
            })
        return result
    except Exception as e:
        print(f"❌ 뉴스 목록 조회 에러: {e}")
        return []

# 3. 뉴스 상세 조회 API
@router.get("/{news_id}")
async def get_news_detail(
    news_id: int = Path(..., description="읽으려는 뉴스의 ID"),
    x_user_id: int = Header(1, alias="X-User-ID"),
    db: aiosqlite.Connection = Depends(get_db_connection)
):
    try:
        db.row_factory = aiosqlite.Row
        query = "SELECT * FROM news WHERE id = ?"
        async with db.execute(query, (news_id,)) as cursor:
            row = await cursor.fetchone()
            
            if not row:
                raise HTTPException(status_code=404, detail="뉴스를 찾을 수 없습니다.")
            
            d = dict(row)
            news_detail = {
                "id": d.get("id"),
                "title": d.get("title"),
                "content": d.get("content") or d.get("summary") or "내용이 없습니다.",
                "summary": d.get("summary", ""),
                "source": d.get("source", "Stocky News"),
                "category": d.get("category", "일반"),
                "published_at": d.get("published_at") or ""
            }

        # 경험치 지급 로직
        try:
            await gain_exp(x_user_id, 10)
            await check_quest(x_user_id, "news_read_1")
        except Exception:
            pass

        return news_detail

    except HTTPException:
        raise 
    except Exception as e:
        print(f"❌ 뉴스 상세 조회 에러: {e}")
        raise HTTPException(status_code=500, detail="서버 내부 오류가 발생했습니다.")