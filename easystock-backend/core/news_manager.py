import sqlite3

def save_news_to_db(ticker: str, news_list: list):
    """
    뉴스 데이터를 DB에 저장합니다. (전문 + 요약 + 영향력 점수 포함)
    """
    # DB 파일 경로가 맞는지 확인하세요
    conn = sqlite3.connect("stock_game.db")
    cursor = conn.cursor()
    
    try:
        saved_count = 0
        for news in news_list:
            # 1. AI가 준 데이터 꺼내기 (없으면 기본값 사용)
            title = news.get("title", "제목 없음")
            content = news.get("content", "내용 없음")
            summary = news.get("summary", "") 
            sentiment = news.get("sentiment", "neutral")
            
            # 여기서 impact 값을 가져옵니다! (없으면 50점)
            impact = news.get("impact_score", news.get("impact", 50))

            if sentiment == "negative" and impact > 0:
                impact = -impact
            # 반대로 positive인데 점수가 음수라면 플러스로 변환
            elif sentiment == "positive" and impact < 0:
                impact = abs(impact)
            
            # 2. DB에 저장하기 (INSERT문 수정 필수!)
            # impact_score 컬럼을 꼭 명시해야 합니다.
            cursor.execute("""
                INSERT INTO news (
                    ticker, 
                    title, 
                    content, 
                    summary, 
                    sentiment, 
                    impact_score,
                    published_at
                )
                VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            """, (ticker, title, content, summary, sentiment, impact))
            
            saved_count += 1
            
        conn.commit()
        print(f"💾 [{ticker}] 뉴스 {saved_count}건 저장 완료 (영향력 점수 포함)")
        
    except Exception as e:
        print(f"❌ 뉴스 저장 실패: {e}")
        # 디버깅을 위해 AI가 준 데이터를 찍어봅니다.
        # print(f"🔍 문제의 데이터: {news_list}") 
    finally:
        conn.close()