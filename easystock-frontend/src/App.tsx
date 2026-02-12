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
import HomeContent from "./components/HomeContent";
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
import { fetchMyPortfolio, placeOrder, loginUser } from "./services/api";

// 1. Layout 컴포넌트 (기존 디자인 유지)
const Layout = ({
  children,
  hideHeader = false,
  notifications,
  onMarkAsRead,
}: {
  children?: React.ReactNode;
  hideHeader?: boolean;
  notifications: NotificationItem[];
  onMarkAsRead: () => void;
}) => {
  const location = useLocation();
  // 프로필을 보여줄 경로들 정의
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
        <>
          <Header
            showProfile={isHome}
            notifications={notifications}
            onMarkAsRead={onMarkAsRead}
          />
          <div className="mx-4 h-[1px] bg-black/5"></div>
        </>
      )}

      <div
        className={`flex flex-1 overflow-hidden ${hideHeader ? "p-0" : "px-4 pt-4"}`}
      >
        {children ? (
          children
        ) : (
          <>
            {isHome && (
              <div className="w-16 mr-3 flex flex-col h-full">
                <Sidebar />
              </div>
            )}
            <div className="flex-1 h-full overflow-hidden">
              <Outlet />
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

// 2. App 컴포넌트 (메인 로직)
const App: React.FC = () => {
  // 상태 관리 (State)
  const [userId, setUserId] = useState<string | null>(
    localStorage.getItem("stocky_user_id"),
  );
  const [cash, setCash] = useState<number>(0);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(initialWatchlist);

  // 로그인 핸들러
  const handleLogin = async (nickname: string) => {
    // 1. 백엔드에 "나 왔어! 돈 줘!" 하고 요청을 보냅니다.
    await loginUser(nickname);

    // 2. 백엔드 처리가 끝나면 브라우저에 저장하고 앱을 켭니다.
    localStorage.setItem("stocky_user_id", nickname);
    setUserId(nickname);
  };

  // 데이터 로딩 (useEffect)
  useEffect(() => {
    if (!userId) return; // 닉네임이 없으면 실행하지 않음

    const loadData = async () => {
      const data = await fetchMyPortfolio(userId);
      if (data && data.portfolio) {
        // 백엔드 데이터를 프론트엔드 형식으로 변환
        const mappedPortfolio = data.portfolio.map((item: any) => ({
          ...item,
          name: item.ticker,
          price:
            typeof item.current_price === "number"
              ? `${item.current_price.toLocaleString()}원`
              : item.price || "0원",
          sharesCount: item.quantity,
          shares: `${item.quantity}주`,
          badge: "실전",
          color: "bg-[#5B89F7]",
          logoText: item.ticker.charAt(0),
          isUp: item.profit_rate >= 0,
        }));
        setCash(data.cash_balance);
        setPortfolio(mappedPortfolio);
      }
    };

    loadData(); // 최초 실행
    const interval = setInterval(loadData, 3000); // 3초마다 갱신
    return () => clearInterval(interval); // 컴포넌트 언마운트 시 정리
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

  // 3. 화면 렌더링

  // 닉네임이 없으면 로그인 모달을 보여줍니다.
  if (!userId) {
    return <LoginModal onLogin={handleLogin} />;
  }

  // 닉네임이 있으면 라우터를 실행합니다.
  return (
    <Router>
      <Routes>
        {/* 공통 레이아웃이 적용되는 페이지들 */}
        <Route
          element={
            <Layout
              notifications={notifications}
              onMarkAsRead={handleMarkNotificationsAsRead}
            />
          }
        >
          {/* 홈 화면: HomeContent 사용 */}
          <Route path="/" element={<HomeContent />} />
          <Route
            path="/assets"
            element={<AssetsContent cash={cash} portfolio={portfolio} />}
          />
          <Route path="/news" element={<NewsContent />} />
          <Route path="/ranking" element={<RankingContent />} />
          <Route path="/community" element={<CommunityContent />} />
          <Route path="/quest" element={<QuestContent />} />

          <Route
            path="/market"
            element={
              <MarketContent
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
                portfolio={portfolio}
                transactions={transactions}
                onBuy={handleBuy}
                onSell={handleSell}
              />
            }
          />
        </Route>

        {/* 전체 화면 페이지들 (헤더 숨김) */}
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
