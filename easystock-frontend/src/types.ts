
export interface StockItem {
  rank: number;
  name: string;
  price: string;
  change: string;
  isUp: boolean;
}

export type SidebarTab = 'assets' | 'news' | 'popular' | 'ranking' | 'community' | 'quest';
export type NavTab = 'home' | 'status' | 'market' | 'chatbot' | 'settings';

export interface StockData {
  name: string;
  price: string;
  change: string;
  isUp: boolean;
  symbol?: string;
  badge?: string;
  shares?: string;
  color?: string;
  logoText?: string;
  id?: number;
}

export interface WatchlistItem extends StockData {
  id: number;
}

export interface PortfolioItem extends StockData {
  id: number;
  badge: string;
  shares: string; // "3주" 형태의 문자열
  sharesCount: number; // 계산을 위한 숫자형
  color: string;
  logoText: string;
}

export interface TransactionItem {
  id: number;
  name: string;
  date: string;
  time: string;
  type: 'buy' | 'sell';
  amount: string; // "1,000,000원" 형태
  pricePerShare: string; // "50,000원" 형태
  qty: string; // "2주" 형태
  logoUrl?: string;
  logoText?: string;
  logoBg?: string;
}

export interface NotificationItem {
  id: number;
  message: string;
  time: string;
  isRead: boolean;
  type: 'buy' | 'sell';
}
