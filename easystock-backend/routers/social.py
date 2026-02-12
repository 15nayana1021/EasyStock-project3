from fastapi import APIRouter, HTTPException
from database import get_db_connection

# 진짜 레벨업 조건표(정답지)를 가져옵니다.
try:
    from services.gamification import LEVEL_TABLE
except ImportError:
    # 혹시 파일이 없으면 임시 테이블 사용 (에러 방지용)
    LEVEL_TABLE = {1: 100, 2: 300, 3: 600, 4: 1000, 5: 1500}

router = APIRouter()

# 🏆 [랭킹 시스템] 부자 순위 TOP 10 조회
@router.get("/ranking")
async def get_ranking():
    conn = await get_db_connection()
    try:
        # 돈(balance)이 많은 순서대로 10명만 가져오기
        async with conn.execute("""
            SELECT username, level, balance, exp 
            FROM users 
            ORDER BY balance DESC 
            LIMIT 10
        """) as cursor:
            rankers = await cursor.fetchall()
        
        return [
            {
                "rank": i + 1,
                "username": row['username'],
                "level": row['level'],
                "balance": row['balance'],
                "exp": row['exp'] # 랭킹에도 경험치 보여주면 좋음
            }
            for i, row in enumerate(rankers)
        ]
    finally:
        await conn.close()

# 👤 [내 정보] 레벨 및 경험치 조회
@router.get("/my-profile/{user_id}")
async def get_my_profile(user_id: int):
    conn = await get_db_connection()
    try:
        # 1. 내 정보 가져오기
        async with conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)) as cursor:
            user = await cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

        # 2. 완료한 퀘스트 개수 세기 (업적 점수용)
        async with conn.execute("SELECT count(*) FROM user_quests WHERE user_id = ? AND is_completed = 1", (user_id,)) as cursor:
            row = await cursor.fetchone()
            quest_count = row[0] if row else 0

        # 가짜 공식(*1000) 삭제 -> 진짜 테이블 조회
        current_lvl = user['level']
        
        # LEVEL_TABLE에서 내 레벨에 맞는 목표치 찾기 (없으면 999999)
        next_goal = LEVEL_TABLE.get(current_lvl, 999999)

        # 현재 경험치가 없으면(None) 0으로 처리
        current_exp = user['exp'] if user['exp'] else 0

        return {
            "username": user['username'],
            "level": current_lvl,
            "balance": user['balance'],
            "quest_cleared": quest_count,
            
            # 프론트엔드에서 퍼센트(%) 계산하려면 '현재값'과 '목표값' 둘 다 필요함!
            "current_exp": current_exp,      # 현재 내 점수
            "next_level_exp": next_goal      # 목표 점수 (이제 3000이 아니라 200, 300 등으로 나옴)
        }
    finally:
        await conn.close()