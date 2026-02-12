import os
import json
import time
from dotenv import load_dotenv
from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential
from json_repair import repair_json

load_dotenv()

class StockAgentService:
    def __init__(self, mode="real"):
        # 1. 공통 설정 로드
        self.conn_str = os.getenv("PROJECT_CONNECTION_STRING")
        
        # 2. 모드에 따른 에이전트 ID 설정
        if mode == "virtual":
            self.agent_id = os.getenv("VIRTUAL_AGENT_ID")
            print(f"🤖 가상 뉴스 생성 모드 (4o-mini) 활성화")
        else:
            self.agent_id = os.getenv("REAL_AGENT_ID")
            print(f"📡 실제 뉴스 분석 모드 (4o) 활성화")

        # 3. 클라이언트 초기화 (한 번만 수행하여 효율성 높임)
        self.project_client = AIProjectClient.from_connection_string(
            conn_str=self.conn_str,
            credential=DefaultAzureCredential()
        )

    def _call_llm(self, prompt: str) -> str:
        try:
            # 1. 스레드(대화방) 생성
            thread = self.project_client.agents.create_thread()

            # 2. 사용자 질문 등록 (메시지 전송)
            self.project_client.agents.create_message(
                thread_id=thread.id,
                role="user",
                content=prompt,
            )

            # 3. 에이전트 실행 (Run) 및 완료 대기
            # create_and_process_run은 실행 후 완료될 때까지 기다려줍니다.
            run = self.project_client.agents.create_and_process_run(
                thread_id=thread.id,
                assistant_id=self.agent_id,
            )

            # 4. 실행 결과 확인 및 응답 가져오기
            if run.status == "completed":
                # 대화 내역 가져오기 (최신 메시지가 맨 앞에 옴)
                messages = self.project_client.agents.list_messages(thread_id=thread.id)
                
                # 가장 최근의 에이전트 응답 찾기
                for msg in messages.data:
                    if msg.role == "assistant":
                        # 텍스트 내용 반환
                        return msg.content[0].text.value
            
            return "" # 실패하거나 응답이 없으면 빈 문자열

        except Exception as e:
            print(f"❌ Azure Agent 호출 중 오류 발생: {e}")
            return ""

    def analyze_stock_news(self, company_name: str, mode="real", count=2):
        # 1. 모드에 따른 프롬프트 생성
        if mode == "virtual":
            system_prompt = f"""
            당신은 주식 시장의 베테랑 기자입니다. '{company_name}'에 대한 가상의 호재 또는 악재 뉴스 {count}개를 생성하세요.
            
            반드시 아래와 같은 JSON 리스트 포맷으로 응답해야 합니다.
            [
                {{
                    "title": "자극적인 뉴스 헤드라인",
                    "content": "기사 전문 (최소 3문단)",
                    "summary": "1~2줄 핵심 요약",
                    "sentiment": "positive 또는 negative",  
                    "impact_score": 1에서 100 사이의 정수 (DB 컬럼명과 일치시킴!)
                }}
            ]
            """
        else: 
            system_prompt = f"""
            당신은 금융 뉴스 분석가입니다. '{company_name}'에 대한 최신 주식 뉴스를 검색하고, 가장 중요한 {count}개의 뉴스만 선정하여 분석하세요.
            
            반드시 아래와 같은 JSON 리스트 포맷으로 응답해야 합니다.
            [
                {{
                    "title": "뉴스 제목",
                    "content": "상세 리포트 전문",
                    "summary": "핵심 요약",
                    "sentiment": "positive, negative, neutral 중 하나",
                    "impact_score": 1에서 100 사이의 정수 (DB 컬럼명과 일치시킴!)
                }}
            ]
            """

        # 2. LLM에게 질문 (사용자님의 기존 LLM 호출 코드)
        # 예: response_text = self.llm.ask(system_prompt) 또는 client.chat.completions.create(...)
        # 아래는 예시입니다. 실제 사용하시는 LLM 호출 코드를 넣으세요.
        print(f"🤖 {company_name} 뉴스 생성 요청 중...")
        response_text = self._call_llm(system_prompt) # <-- 여기! 실제 LLM 호출 메서드

        if not response_text:
            print(f"❌ {company_name}: LLM 응답이 없습니다. (로그인 만료 가능성)")
            return []  # 빈 리스트 반환하고 끝냄

        # 3. JSON 파싱 (json_repair 사용)
        # 마크다운(```json) 제거나 따옴표 오류 등을 알아서 복구해줍니다.
        try:
            print("🧹 JSON 데이터 청소 및 파싱 중...")
            news_data = repair_json(response_text, return_objects=True)
            
            # 만약 결과가 리스트가 아니라 딕셔너리 하나만 왔을 경우 리스트로 감싸기
            if isinstance(news_data, dict):
                news_data = [news_data]
                
            return news_data
            
        except Exception as e:
            print(f"❌ JSON 파싱 실패: {e}")
            # 실패 시 빈 리스트 반환하여 서버가 죽지 않게 함
            return []
            
        # 2. AI 에이전트 호출 (이 부분은 기존 코드와 동일하게 유지)
        thread = self.project_client.agents.create_thread()
        
        self.project_client.agents.create_message(
            thread_id=thread.id,
            role="user",
            content=system_prompt
        )

        run = self.project_client.agents.create_run(thread_id=thread.id, assistant_id=self.agent_id)
        
        while run.status in ["queued", "in_progress"]:
            time.sleep(1)
            run = self.project_client.agents.get_run(thread_id=thread.id, run_id=run.id)

        if run.status == "completed":
            messages = self.project_client.agents.list_messages(thread_id=thread.id)
            last_msg = messages.data[0].content[0].text.value
            
            try:
                # JSON 파싱 (마크다운 기호 ```json 제거)
                clean_json = last_msg.replace("```json", "").replace("```", "").strip()
                return json.loads(clean_json)
            except Exception as e:
                print(f"⚠️ JSON 파싱 에러: {e}")
                return [{"error": "JSON 파싱 실패", "raw": last_msg}]
        else:
            return [{"error": f"분석 실패: {run.status}"}]