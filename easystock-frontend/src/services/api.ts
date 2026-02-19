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
  open?: number;
  high?: number;
  low?: number;
  close?: number;
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
  display_date?: string;
}

// --- API 함수 ---

// 1. 기업 목록 조회 (GET /stocks)
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
      const formattedPrice = stock.price.toLocaleString() + "원";

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
    console.error("Failed to fetch companies:", error);
    return [];
  }
};

// 2. 내 자산 정보 조회 (GET /users/me/portfolio)
export const fetchMyPortfolio = async (userId: string = "1") => {
  try {
    const safeUserId = parseInt(userId) || 1;

    const response = await fetch(
      `${BASE_URL}/users/me/portfolio?user_id=${safeUserId}`,
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

// 3-1. 뉴스 상세내용
export const fetchNewsDetail = async (id: number): Promise<NewsItem> => {
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

// 3-2. 주식 상세 화면용 (특정 종목 뉴스만)
export const fetchStockNews = async (ticker: string) => {
  try {
    if (!ticker) return [];

    const encodedTicker = encodeURIComponent(ticker);
    console.log(`[API 요청] 뉴스 조회: ${ticker} -> ${encodedTicker}`);

    const response = await fetch(
      `${BASE_URL}/api/stocks/${encodedTicker}/news`,
    );

    if (!response.ok) {
      console.error("API 응답 에러:", response.status);
      return [];
    }

    const data = await response.json();
    console.log(`[API 응답] ${ticker} 뉴스 ${data.length}개 수신됨`);

    return data;
  } catch (error) {
    console.error("종목 뉴스 로딩 실패", error);
    return [];
  }
};

// 4. 주식 주문 (POST /api/trade/order)
export const placeOrder = async (
  ticker: string,
  side: "BUY" | "SELL",
  price: number,
  quantity: number,
  userId: string = "1",
  gameDate: string,
) => {
  try {
    const safeUserId = parseInt(userId) || 1;
    const response = await fetch(`${BASE_URL}/api/trade/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: parseInt(userId) || 1,
        ticker: ticker,
        side: side,
        quantity: quantity,
        price: price,
        order_type: "LIMIT",
        game_date: gameDate,
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
      `${BASE_URL}/api/stocks/${ticker}/chart?period=${period}`,
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
    const response = await fetch(`${BASE_URL}/api/stocks/${ticker}/orderbook`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
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

// 8. 내 프로필(레벨) 정보 조회
export const fetchMyProfile = async (userId: string = "1") => {
  try {
    const safeUserId = parseInt(userId) || 1;

    const response = await fetch(
      `${BASE_URL}/api/social/my-profile/${safeUserId}`,
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    return null;
  }
};

// 9. 내 주문 내역 가져오기 (미체결 확인용)
export const fetchMyOrders = async (userId: string) => {
  try {
    const safeUserId = parseInt(userId) || 1;

    const response = await fetch(`${BASE_URL}/api/trade/orders/${safeUserId}`);
    if (!response.ok) throw new Error("주문 내역 조회 실패");
    return await response.json();
  } catch (error) {
    console.error("주문 내역 로딩 에러:", error);
    return [];
  }
};

// 10. 주문 취소하기 (미체결 탭에서 사용)
export const cancelOrder = async (orderId: number) => {
  try {
    const response = await fetch(`${BASE_URL}/api/trade/order/${orderId}`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (error) {
    console.error("주문 취소 실패:", error);
    return { success: false };
  }
};

export const fetchAllOrders = async (userId: string) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/trade/orders/all/${userId}?t=${Date.now()}`,
    );

    if (!response.ok) {
      return [];
    }
    return await response.json();
  } catch (error) {
    console.error("주문 내역 로딩 실패", error);
    return [];
  }
};
