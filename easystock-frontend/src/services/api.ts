import { StockData } from "../types";

export const BASE_URL =
  "https://8ai-final-team4-appservice-ecf5gegpfkb3cscv.koreacentral-01.azurewebsites.net";

// 1. 데이터 타입 정의

export interface Company {
  ticker: string;
  name: string;
  sector: string;
  current_price: number;
  description?: string;
}

export interface ChartDataPoint {
  time: string;
  price?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

export interface OrderBookItem {
  price: number;
  volume: number;
  type: "ask" | "bid";
}

export interface OrderBook {
  ticker: string;
  current_price: number;
  asks: OrderBookItem[];
  bids: OrderBookItem[];
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

export interface CompanyData {
  ticker: string;
  name: string;
  sector: string;
  current_price: number;
  change_amount: number;
  change_rate: number;
  volume?: number;
}

export interface ChartData {
  time: string;
  price: number;
}

export interface News {
  id: number;
  ticker: string;
  title: string;
  summary: string;
  sentiment: string;
  impact_score: number;
  published_at: string;
}

export interface CommunityPost {
  id: number;
  author: string;
  content: string;
  sentiment: "BULL" | "BEAR";
  time: string;
}

export interface RankItem {
  agent_id: string;
  total_asset: number;
}

export interface MentorAdvice {
  opinion: string;
  core_logic: string;
  feedback_to_user: string;
  chat_message: string;
}

export interface MentorAdviceResponse {
  NEUTRAL?: MentorAdvice;
  VALUE?: MentorAdvice;
  MOMENTUM?: MentorAdvice;
  CONTRARIAN?: MentorAdvice;
  generated_at?: string;
  error?: string;
}

export interface UserStatusResponse {
  user_id: string;
  balance: number;
  portfolio: Record<string, number>;
  sim_time: string;
}

// 2. API 함수들 (내 기존 함수 완벽 보존)

export const fetchCompanies = async (): Promise<StockData[]> => {
  try {
    const response = await fetch(`${BASE_URL}/api/stocks`);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();

    return data.map((stock: any, index: number) => {
      const rawPrice = stock.current_price ?? stock.price ?? 0;
      const rawChange = stock.change_rate ?? 0;

      const formattedPrice = Number(rawPrice).toLocaleString() + "원";

      const isUp = rawChange >= 0;
      const displayChange =
        (isUp ? "+" : "") + Number(rawChange).toFixed(2) + "%";

      return {
        id: index + 1,
        name: stock.name || "정보 없음",
        price: formattedPrice,
        change: displayChange,
        isUp: isUp,
        symbol: stock.ticker,
        badge: stock.sector || "기타",
      };
    });
  } catch (error) {
    console.error("Failed to fetch companies:", error);
    return [];
  }
};

export const fetchNews = async (): Promise<News[]> => {
  try {
    const response = await fetch(`${BASE_URL}/api/news`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch all news:", error);
    return [];
  }
};

export const fetchCompanyNews = async (
  companyName: string,
): Promise<NewsItem[]> => {
  try {
    const encodedName = encodeURIComponent(companyName);
    const response = await fetch(`${BASE_URL}/api/news/${encodedName}`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch company news:", error);
    return [];
  }
};

export const fetchMyPortfolio = async (userId: string = "1") => {
  try {
    const safeUserId = parseInt(userId) || 1;
    const response = await fetch(
      `${BASE_URL}/users/me/portfolio?user_id=${safeUserId}`,
    );
    if (!response.ok) throw new Error("Failed to fetch portfolio");
    return await response.json();
  } catch (error) {
    return null;
  }
};

export const fetchNewsDetail = async (id: number): Promise<NewsItem> => {
  const response = await fetch(`${BASE_URL}/api/news/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", "X-User-ID": "1" },
  });
  if (!response.ok)
    throw new Error("뉴스 상세 정보를 가져오는데 실패했습니다.");
  return response.json();
};

export const fetchStockNews = async (ticker: string) => {
  try {
    if (!ticker) return [];
    const encodedTicker = encodeURIComponent(ticker);
    const response = await fetch(
      `${BASE_URL}/api/stocks/${encodedTicker}/news`,
    );
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    return [];
  }
};

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
        user_id: safeUserId,
        ticker: ticker,
        side: side,
        type: side.toLowerCase(),
        quantity: quantity,
        price: price,
        order_type: "LIMIT",
        game_date: gameDate,
      }),
    });
    return await response.json();
  } catch (error) {
    return { success: false, message: "서버 통신 에러" };
  }
};

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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname }),
    });
    return await response.json();
  } catch (error) {
    return { success: false };
  }
};

export const fetchOrderBook = async (ticker: string) => {
  console.log(`[호가창 요청 URL] : ${BASE_URL}/api/stocks/${ticker}/orderbook`);

  try {
    const response = await fetch(`${BASE_URL}/api/stocks/${ticker}/orderbook`);

    console.log(`[호가창 응답 상태] : ${response.status}`);

    if (!response.ok) return null;

    const data = await response.json();
    console.log("[호가창 실제 데이터] :", JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error("호가창 요청 에러:", error);
    return null;
  }
};

export const fetchRanking = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/social/ranking`);
    if (!response.ok) throw new Error("Failed to fetch ranking");
    return await response.json();
  } catch (error) {
    return [];
  }
};

export const fetchMyProfile = async (userId: string = "1") => {
  try {
    const safeUserId = parseInt(userId) || 1;
    const response = await fetch(
      `${BASE_URL}/api/social/my-profile/${safeUserId}`,
    );
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
};

export const fetchMyOrders = async (userId: string) => {
  try {
    const safeUserId = parseInt(userId) || 1;
    const response = await fetch(`${BASE_URL}/api/trade/orders/${safeUserId}`);
    if (!response.ok) throw new Error("주문 내역 조회 실패");
    return await response.json();
  } catch (error) {
    return [];
  }
};

export const cancelOrder = async (orderId: number) => {
  try {
    const response = await fetch(`${BASE_URL}/api/trade/order/${orderId}`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (error) {
    return { success: false };
  }
};

export const fetchAllOrders = async (userId: string) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/trade/orders/all/${userId}?t=${Date.now()}`,
    );
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    return [];
  }
};

export const resetGame = async (userId: number) => {
  try {
    const response = await fetch(`${BASE_URL}/api/user/reset/${userId}`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("초기화 실패");
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// 3. 추가 API 함수들

export const initUser = async (username: string) => {
  try {
    const response = await fetch(`${BASE_URL}/api/user/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    return await response.json();
  } catch (error) {
    console.error("User init failed:", error);
  }
};

export const fetchUserStatus = async (
  username: string,
): Promise<UserStatusResponse | null> => {
  try {
    const response = await fetch(`${BASE_URL}/api/user/status`, {
      headers: { "X-User-ID": `USER_${username}` },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
};

export const fetchTeamCompanies = async (): Promise<CompanyData[]> => {
  try {
    const response = await fetch(`${BASE_URL}/api/companies`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    return [];
  }
};

export const fetchChartData = async (ticker: string): Promise<ChartData[]> => {
  try {
    const response = await fetch(`${BASE_URL}/api/chart/${ticker}?limit=3000`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    return [];
  }
};

export const fetchCommunityPosts = async (
  ticker: string,
): Promise<CommunityPost[]> => {
  try {
    const response = await fetch(`${BASE_URL}/team/api/community/${ticker}`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    return [];
  }
};

export const fetchRank = async (): Promise<RankItem[]> => {
  try {
    const response = await fetch(`${BASE_URL}/api/rank`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    return [];
  }
};

export const fetchMentorAdvice = async (
  ticker: string,
): Promise<MentorAdviceResponse | null> => {
  try {
    const response = await fetch(`${BASE_URL}/team/api/advice/${ticker}`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    return null;
  }
};

export const fetchAgentChat = async (
  agentType: string,
  message: string,
): Promise<string> => {
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_type: agentType, message: message }),
    });
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data.reply;
  } catch (error) {
    return "통신 불안정";
  }
};

export const fetchGlobalCommunityPosts = async () => {
  try {
    const res = await fetch(`${BASE_URL}/team/api/community/global`);
    if (!res.ok) throw new Error("Network response was not ok");
    return await res.json();
  } catch (error) {
    console.error("Global community fetch failed:", error);
    return [];
  }
};

export const postCommunityMessage = async (
  author: string,
  content: string,
  ticker: string = "GLOBAL",
) => {
  try {
    await fetch(`${BASE_URL}/team/api/community`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, content, ticker, sentiment: "BULL" }),
    });
  } catch (error) {
    console.error("Failed to post message:", error);
  }
};
