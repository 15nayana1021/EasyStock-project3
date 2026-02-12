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
  sentiment: string;
  impact_score: number;
  source?: string;
  published_at?: string;
}

// --- API 함수 ---

// 1. 기업 목록 조회 (GET /stocks)
// main.py의 실시간 엔진 가격을 가져옵니다.
export const fetchCompanies = async (): Promise<StockData[]> => {
  try {
    const response = await fetch(`${BASE_URL}/stocks`);
    if (!response.ok) throw new Error("Network response was not ok");
    const data: Company[] = await response.json();

    return data.map((company, index) => ({
      id: index + 1,
      name: company.name,
      price: company.current_price.toLocaleString() + "원",
      change: "0.00%", // 백엔드 로직에 따라 추후 업데이트
      isUp: true,
      symbol: company.ticker,
      badge: company.sector,
    }));
  } catch (error) {
    console.error("Failed to fetch companies:", error);
    return [];
  }
};

// 2. 내 자산 정보 조회 (GET /users/me/portfolio)
// AssetsContent.tsx에서 사용됩니다.
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
// NewsContent.tsx에서 사용됩니다.
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

// 4. 주식 주문 (POST /api/trade/order)
// StockDetail.tsx의 매수/매도 버튼에서 호출합니다.
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
