import { StockData } from "../types";

const BASE_URL = "http://localhost:8000";

// --- 데이터 타입 정의 ---
export interface Company {
  ticker: string;
  name: string;
  sector: string;
  current_price: number;
}

export interface ChartDataPoint {
  time: string;
  price: number;
}

export interface PortfolioItem {
  ticker: string;
  quantity: number;
  current_price: number;
  profit_rate: number;
  average_price: number;
}

export interface MyPortfolioResponse {
  name: string;
  cash_balance: number;
  total_asset_value: number;
  portfolio: PortfolioItem[];
}

export interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content?: string;
  sentiment: string;
  impact_score: number;
  category: string;
  source?: string;
  published_at?: string;
}

// --- API 함수 ---

// 1. 기업 목록 조회 (GET /stocks)
// main.py의 실시간 엔진 가격을 가져옵니다.
export const fetchCompanies = async (): Promise<StockData[]> => {
  try {
    // 1. 백엔드 API 호출 (주소에 /api 추가됨)
    const response = await fetch(`${BASE_URL}/api/stocks`);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    // 2. 백엔드에서 보낸 12개 기업 데이터 받기
    const data = await response.json();

    // 3. 백엔드 데이터를 프론트엔드 UI 형식에 맞게 변환 (Mapping)
    return data.map((stock: any, index: number) => {
      // 숫자인 가격을 '172,000원' 형태로 변환
      const formattedPrice = stock.price.toLocaleString() + "원";

      // 등락률에 따른 색상/기호 결정
      const isUp = stock.change_rate >= 0;
      const displayChange =
        (isUp ? "+" : "") + stock.change_rate.toFixed(2) + "%";

      return {
        id: index + 1,
        name: stock.name,
        price: formattedPrice,
        change: displayChange,
        isUp: isUp,
        symbol: stock.ticker,
        badge: stock.sector,
      };
    });
  } catch (error) {
    // 에러 발생 시 콘솔에 찍고 빈 배열 반환 (앱이 멈추지 않게 함)
    console.error("Failed to fetch companies:", error);
    return [];
  }
};

// 2. 내 자산 정보 조회 (GET /users/me/portfolio)
export const fetchMyPortfolio = async (userId: string = "1") => {
  // 기본값 "1"
  try {
    // URL에 user_id 쿼리 파라미터를 붙여서 보냅니다.
    const response = await fetch(
      `${BASE_URL}/users/me/portfolio?user_id=${userId}`,
    );
    if (!response.ok) throw new Error("Failed to fetch portfolio");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch portfolio:", error);
    return null;
  }
};

// 3. 뉴스 목록 조회 (GET /api/news)
export const fetchNewsList = async (): Promise<NewsItem[]> => {
  try {
    const response = await fetch(`${BASE_URL}/api/news`);
    if (!response.ok) throw new Error("Failed to fetch news");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return [];
  }
};

// 3. 뉴스 상세내용
export const fetchNewsDetail = async (id: number): Promise<NewsItem> => {
  // 백엔드의 상세 조회 API 호출 (경로 주의: /news/123)
  const response = await fetch(`${BASE_URL}/api/news/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-User-ID": "1",
    },
  });

  if (!response.ok) {
    throw new Error("뉴스 상세 정보를 가져오는데 실패했습니다.");
  }

  return response.json();
};

// 4. 주식 주문 (POST /api/trade/order)
export const placeOrder = async (
  ticker: string,
  side: "BUY" | "SELL",
  price: number,
  quantity: number,
  userId: string = "1",
) => {
  try {
    const response = await fetch(`${BASE_URL}/api/trade/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        ticker: ticker,
        side: side,
        quantity: quantity,
        price: price,
        order_type: "LIMIT",
      }),
    });
    return await response.json();
  } catch (error) {
    console.error("Order failed:", error);
    return { success: false, message: "서버 통신 에러" };
  }
};

// 5. 주식 차트 조회 (기존 유지)
export const fetchStockChart = async (
  ticker: string,
  period: string = "1d",
): Promise<ChartDataPoint[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/stocks/${ticker}/chart?period=${period}`,
    );
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    return [];
  }
};

export const loginUser = async (nickname: string) => {
  try {
    const response = await fetch(`${BASE_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname }),
    });
    return await response.json();
  } catch (error) {
    console.error("Login failed:", error);
    return { success: false };
  }
};

// 6. 호가(주문창) 데이터 조회 (GET /stocks/{ticker}/orderbook)
export const fetchOrderBook = async (ticker: string) => {
  try {
    const response = await fetch(`${BASE_URL}/stocks/${ticker}/orderbook`);
    if (!response.ok) throw new Error("Failed to fetch orderbook");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch orderbook:", error);
    return null;
  }
};

// 7. 랭킹 데이터 조회 (GET /api/social/ranking)
export const fetchRanking = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/social/ranking`);
    if (!response.ok) throw new Error("Failed to fetch ranking");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch ranking:", error);
    return [];
  }
};
