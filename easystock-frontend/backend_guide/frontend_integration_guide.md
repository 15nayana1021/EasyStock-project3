# 프론트엔드 연동 가이드 (Backend Integration Guide)

이 문서는 프론트엔드와 백엔드 간의 데이터 연동 현황과, 백엔드 팀(Heo, Lee)이 작업 시 참고해야 할 사항을 정리한 가이드입니다.

## 1. 개요 (Overview)

프론트엔드는 현재 `src/services/api.ts`를 통해 백엔드 API를 호출하도록 설정되어 있습니다.
Heo님과 Lee님의 명세서를 모두 반영하여 통합된 구조를 잡았습니다.

*   **API 기본 주소**: `http://localhost:8000`
*   **핵심 파일**: `src/services/api.ts`

---

## 2. API 연동 상세 (Detail Specs)

### A. 기업 목록 조회 (Lee 담당)

*   **Endpoint**: `GET /api/companies`
*   **사용 컴포넌트**: `src/components/MarketContent.tsx`
*   **현재 상황**:
    *   이름, 티커, 현재가, 섹터 정보는 잘 연동됩니다.
    *   **[요청 사항]**: 현재 API 응답에 **'전일 대비 등락폭/등락률' (change / changePercent)** 데이터가 없습니다.
    *   프론트엔드에서는 임시로 `0`으로 처리하고 있습니다. 추후 이 데이터를 추가해주시면 주석 처리된 부분을 해제하여 바로 반영 가능합니다.

### B. 주식 차트 조회 (Heo 담당)

*   **Endpoint**: `GET /stocks/{ticker}/chart`
*   **파라미터**: `period` (값: `1d`, `1w`, `1m`, `1y`)
*   **사용 컴포넌트**: `src/components/StockDetail.tsx`
*   **현재 상황**:
    *   프론트엔드는 캔들 차트(시가/고가/저가/종가)를 그리기 위해 OHLC 데이터를 기대합니다.
    *   만약 백엔드에서 **단순 시간별 가격(Time-Price)**만 내려준다면, 프론트엔드에서 `Open = High = Low = Close = Price`로 강제 매핑하여 차트를 그립니다.
    *   **[요청 사항]**: 가능하다면 `open`, `high`, `low`, `close` 데이터를 포함하여 보내주시면 더 예쁜 캔들 차트를 그릴 수 있습니다.
    *   기간(`period`) 파라미터에 따라 데이터 간격을 조절해서 보내주셔야 합니다 (예: 1d는 30분 간격, 1y는 1달 간격 등).

---

## 3. 주요 코드 위치 (Key Code Locations)

백엔드 팀이 참고하거나 수정해야 할 프론트엔드 코드는 아래와 같습니다. 각 파일에는 **`[백엔드 팀]`** 이라는 태그로 주석을 달아두었습니다.

1.  **`src/services/api.ts`**
    *   전체 API 호출 함수가 모여 있습니다. 엔드포인트 URL이나 응답 타입(Interface)이 변경되면 이 파일을 수정하세요.

2.  **`src/components/MarketContent.tsx`**
    *   `useEffect` 내부에서 기업 목록을 불러오고 UI 데이터로 변환합니다. `change` 데이터가 생기면 이곳의 매핑 로직을 수정하면 됩니다.

3.  **`src/components/StockDetail.tsx`**
    *   `useEffect` 내부에서 차트 데이터를 불러옵니다. OHLC 데이터가 정식으로 지원되면 매핑 로직을 업데이트하세요.

---

## 4. 테스트 방법

1.  백엔드 서버를 `localhost:8000` 포트로 실행합니다.
2.  프론트엔드를 실행합니다 (`npm run dev`).
3.  **시장 (Market)** 탭을 눌러 기업 목록이 뜨는지 확인합니다. (안 뜨면 콘솔 로그 확인)
4.  기업을 클릭하여 **상세 페이지**로 진입 후, 차트가 그려지는지 확인합니다. 기간 버튼(1일, 1주 등)을 눌러 요청이 잘 가는지 확인합니다.

---

## 5. 제거 및 정리해야 할 더미 데이터 (Dummy Data to Remove)

데이터 연동이 완벽히 확인된 후, 코드의 깔끔한 관리를 위해 제거하거나 정리해야 할 부분입니다.

### A. MarketContent.tsx (시장 탭)
*   **폴백 데이터 사용**: 현재 `fetchCompanies()`가 실패하거나 빈 배열을 반환할 경우, `src/data/mockData.ts`의 `allRankingStocks`를 폴백(Fallback)으로 사용하고 있습니다.
*   **정리 방법**: 백엔드 데이터가 안정화되면 `loadCompanies` 함수 내의 `else { ... setRankingStocks(allRankingStocks); }` 로직을 제거하고 에러 메시지만 출력하도록 변경해야 합니다.

### B. StockDetail.tsx (주식 상세/차트)
*   **더미 데이터 생성 함수**: `generateDummyCandleData` 함수가 내장되어 있습니다. 백엔드에서 데이터가 오지 않을 경우 가상의 캔들을 그려주기 위함입니다.
*   **정리 방법**: 연동 완료 후 이 함수 자체를 삭제하고, `loadChartData`에서 데이터가 없을 때의 처리(catch 구문 등)에서 이 함수 호출을 제거해야 합니다.

### C. src/data/mockData.ts (전체 모의 데이터)
*   프로젝트 전반에 걸쳐 사용되는 `allRankingStocks`, `newsListMock` 등이 정의되어 있습니다.
*   **정리 방법**: 모든 기능(뉴스, 랭킹 등)이 백엔드와 연결되면 이 파일의 의존성을 모두 끊고 최종적으로 파일을 삭제하거나 초기화할 수 있습니다.
