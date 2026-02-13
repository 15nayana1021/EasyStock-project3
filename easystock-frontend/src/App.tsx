import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Outlet,
} from "react-router-dom";

// --- 컴포넌트 임포트 ---
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import LoginModal from "./components/LoginModal";

// --- 페이지/콘텐츠 임포트 ---
import PopularStocks from "./components/PopularStocks";
import NewsContent from "./components/NewsContent";
import CommunityContent from "./components/CommunityContent";
import QuestContent from "./components/QuestContent";
import RankingContent from "./components/RankingContent";
import AssetsContent from "./components/AssetsContent";
import StockStatusContent from "./components/StockStatusContent";
import MarketContent from "./components/MarketContent";
import ChatbotContent from "./components/ChatbotContent";
import SettingsContent from "./components/SettingsContent";

// --- 데이터 및 API 임포트 ---
import {
  StockData,
  PortfolioItem,
  TransactionItem,
  NotificationItem,
  WatchlistItem,
} from "./types";
import { initialWatchlist } from "./data/mockData";
import {
  fetchMyPortfolio,
  placeOrder,
  loginUser,
  fetchCompanies,
} from "./services/api";

// 1. Layout 컴포넌트 (기존 디자인 유지)
const Layout = ({
  children,
  hideHeader = false,
  notifications,
  onMarkAsRead,
  nickname,
  level,
  cash,
  portfolio,
}: {
  children?: React.ReactNode;
  hideHeader?: boolean;
  notifications: NotificationItem[];
  onMarkAsRead: () => void;
  nickname?: string;
  level?: number;
  cash?: number;
  portfolio?: PortfolioItem[];
}) => {
  const location = useLocation();
  const isHome = [
    "/",
    "/assets",
    "/news",
    "/ranking",
    "/community",
    "/quest",
  ].includes(location.pathname);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#F4F8F6] relative overflow-hidden shadow-2xl font-['Pretendard']">
      {!hideHeader && (
        <div className="shrink-0">
          <Header
            showProfile={isHome}
            notifications={notifications}
            onMarkAsRead={onMarkAsRead}
            nickname={nickname}
            level={level}
          />
          <div className="mx-4 h-[1px] bg-black/5"></div>
        </div>
      )}

      <div
        className={`flex flex-1 overflow-hidden relative ${hideHeader ? "p-0" : "px-4 pt-4"}`}
      >
        {children ? (
          <div className="w-full h-full overflow-hidden flex flex-col">
            {children}
          </div>
        ) : (
          <>
            {isHome && (
              <div className="w-16 mr-3 flex flex-col h-full shrink-0">
                <Sidebar cash={cash} portfolio={portfolio} />
              </div>
            )}
            <div className="flex-1 h-full overflow-hidden">
              <Outlet />
            </div>
          </>
        )}
      </div>
      <div className="shrink-0 border-t border-black/5">
        <BottomNav />
      </div>
    </div>
  );
};

// 2. App 컴포넌트 (메인 로직)
const App: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(
    localStorage.getItem("stocky_user_id"),
  );
  const [cash, setCash] = useState<number>(0);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(initialWatchlist);
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [level, setLevel] = useState<number>(1);

  // 로그인 핸들러
  const handleLogin = async (nickname: string) => {
    // 1. 백엔드에 "나 왔어! 돈 줘!" 하고 요청을 보냅니다.
    await loginUser(nickname);

    // 2. 백엔드 처리가 끝나면 브라우저에 저장하고 앱을 켭니다.
    localStorage.setItem("stocky_user_id", nickname);
    setUserId(nickname);
  };

  // 데이터 로딩 (useEffect)
  const loadData = async () => {
    if (!userId) return;
    const data = await fetchMyPortfolio(userId);
    if (data && data.portfolio) {
      const mappedPortfolio = data.portfolio.map((item: any) => ({
        ...item,
        name: item.ticker,
        price:
          typeof item.current_price === "number"
            ? `${item.current_price.toLocaleString()}원`
            : item.price || "0원",
        sharesCount: item.quantity,
        shares: `${item.quantity}주`,
        isUp: item.profit_rate >= 0,
      }));
      setCash(data.cash_balance);
      setPortfolio(mappedPortfolio);
    }
  };

  // 2. useEffect는 이제 loadData를 호출만 합니다.
  useEffect(() => {
    if (!userId) return;
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  // 거래 핸들러 (매수/매도)
  const handleBuy = async (stock: StockData, price: number, qty: number) => {
    if (!userId) return;
    const ticker = stock.symbol || stock.name;
    const result = await placeOrder(ticker, "BUY", price, qty);

    if (result.success) {
      alert(`${stock.name} 매수 완료!`);
      // 데이터 즉시 갱신
      const updated = await fetchMyPortfolio(userId);
      if (updated) {
        setCash(updated.cash_balance);
        setPortfolio(updated.portfolio as any);
      }
      addNotification(`${stock.name} ${qty}주를 매수했습니다.`, "buy");
    } else {
      alert(result.message || "주문 실패");
    }
  };

  const handleSell = async (stock: StockData, price: number, qty: number) => {
    if (!userId) return;
    const ticker = stock.symbol || stock.name;
    const result = await placeOrder(ticker, "SELL", price, qty);

    if (result.success) {
      alert(`${stock.name} 매도 완료!`);
      const updated = await fetchMyPortfolio(userId);
      if (updated) {
        setCash(updated.cash_balance);
        setPortfolio(updated.portfolio as any);
      }
      addNotification(`${stock.name} ${qty}주를 매도했습니다.`, "sell");
    } else {
      alert(result.message || "주문 실패");
    }
  };

  // 기타 헬퍼 함수들
  const handleToggleWatchlist = (stock: StockData) => {
    const exists = watchlist.find((item) => item.name === stock.name);
    if (exists) {
      setWatchlist((prev) => prev.filter((item) => item.name !== stock.name));
    } else {
      const newItem: WatchlistItem = {
        id: Date.now(),
        name: stock.name,
        price: stock.price,
        change: stock.change,
        isUp: stock.isUp,
        shares: "0주",
        badge: "관심",
        color: stock.color || "bg-gray-400",
        logoText: stock.logoText || stock.name.charAt(0),
      };
      setWatchlist((prev) => [...prev, newItem]);
    }
  };

  const addNotification = (message: string, type: "buy" | "sell") => {
    const newNoti: NotificationItem = {
      id: Date.now(),
      message,
      time: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isRead: false,
      type,
    };
    setNotifications((prev) => [newNoti, ...prev]);
  };

  const handleMarkNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  useEffect(() => {
    const loadStocks = async () => {
      try {
        const data = await fetchCompanies();
        setStocks(data);
      } catch (error) {
        console.error("Failed to load stocks:", error);
      }
    };

    loadStocks();
    const interval = setInterval(loadStocks, 5000);
    return () => clearInterval(interval);
  }, []);

  const livePortfolio = portfolio.map((item) => {
    const normalizedName = item.name === "삼성전자" ? "삼송전자" : item.name;

    const liveStock = stocks.find(
      (s) => s.name === normalizedName || s.symbol === normalizedName,
    );

    if (liveStock) {
      const currentPriceNum =
        typeof liveStock.price === "number"
          ? liveStock.price
          : Number(liveStock.price.toString().replace(/[^0-9-]/g, ""));

      return {
        ...item,
        current_price: currentPriceNum,
      };
    }
    return item;
  });

  // 닉네임이 없으면 로그인 모달을 보여줍니다.
  if (!userId) {
    return <LoginModal onLogin={handleLogin} />;
  }

  // 닉네임이 있으면 라우터를 실행합니다. (여기서부터 끝까지 복사해서 덮어쓰세요)
  return (
    <Router>
      <Routes>
        <Route
          element={
            <Layout
              notifications={notifications}
              onMarkAsRead={handleMarkNotificationsAsRead}
              nickname={userId || "투자자"}
              level={level}
              cash={cash}
              portfolio={livePortfolio}
            />
          }
        >
          <Route path="/" element={<PopularStocks />} />

          <Route
            path="/assets"
            element={
              <AssetsContent
                cash={cash}
                portfolio={livePortfolio}
                refreshData={loadData}
              />
            }
          />
          <Route path="/news" element={<NewsContent />} />
          <Route path="/ranking" element={<RankingContent />} />
          <Route path="/community" element={<CommunityContent />} />
          <Route path="/quest" element={<QuestContent />} />

          <Route
            path="/market"
            element={
              <MarketContent
                stocks={stocks}
                watchlist={watchlist}
                onToggleWatchlist={handleToggleWatchlist}
                onBuy={handleBuy}
                onSell={handleSell}
              />
            }
          />

          <Route
            path="/status"
            element={
              <StockStatusContent
                watchlist={watchlist}
                onToggleWatchlist={handleToggleWatchlist}
                cash={cash}
                portfolio={livePortfolio}
                transactions={transactions}
                onBuy={handleBuy}
                onSell={handleSell}
              />
            }
          />
        </Route>

        <Route
          path="/chatbot"
          element={
            <Layout
              hideHeader
              notifications={notifications}
              onMarkAsRead={handleMarkNotificationsAsRead}
            >
              <ChatbotContent onBack={() => window.history.back()} />
            </Layout>
          }
        />

        <Route
          path="/settings"
          element={
            <Layout
              hideHeader
              notifications={notifications}
              onMarkAsRead={handleMarkNotificationsAsRead}
            >
              <SettingsContent
                notifications={notifications}
                onMarkAsRead={handleMarkNotificationsAsRead}
              />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
