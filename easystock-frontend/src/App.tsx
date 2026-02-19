import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Outlet,
  useParams,
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
import StockDetail from "./components/StockDetail";

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
  fetchMyProfile,
  fetchAllOrders,
  NewsItem,
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
  virtualDate,
  activeNews,
}: {
  children?: React.ReactNode;
  hideHeader?: boolean;
  notifications: NotificationItem[];
  onMarkAsRead: () => void;
  nickname?: string;
  level?: number;
  cash?: number;
  portfolio?: PortfolioItem[];
  virtualDate?: string;
  activeNews?: NewsItem[];
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
            virtualDate={virtualDate}
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
              <Outlet context={{ activeNews }} />
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

const StockDetailWrapper = ({
  stocks,
  watchlist,
  onBuy,
  onSell,
  onToggleWatchlist,
  virtualDate,
}: any) => {
  const { symbol } = useParams();

  // 전체 주식(stocks) 중에서 주소창 이름과 똑같은 주식을 찾습니다.
  const stock = stocks.find(
    (s: StockData) => s.symbol === symbol || s.name === symbol,
  );

  // 주식 데이터를 아직 못 찾았을 때 튕기지 않게 막아줍니다.
  if (!stock) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 font-bold">
        주식 정보를 불러오는 중입니다...
      </div>
    );
  }

  // 이 주식이 내 관심종목(하트)에 있는지 확인합니다.
  const isLiked = watchlist.some(
    (item: WatchlistItem) => item.name === stock.name,
  );

  // 완벽하게 준비된 데이터를 진짜 StockDetail로 넘겨줍니다!
  return (
    <StockDetail
      stock={stock}
      isLiked={isLiked}
      onToggleWatchlist={() => onToggleWatchlist(stock)}
      onBack={() => window.history.back()}
      onBuy={onBuy}
      onSell={onSell}
      virtualDate={virtualDate}
    />
  );
};

// 2. App 컴포넌트 (메인 로직)
const App: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(
    localStorage.getItem("stocky_user_id"),
  );
  const [nickname, setNickname] = useState<string>(
    localStorage.getItem("stocky_nickname") || "투자자",
  );
  const [cash, setCash] = useState<number>(0);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(initialWatchlist);

  const [stocks, setStocks] = useState<StockData[]>([]);
  const [level, setLevel] = useState<number>(1);
  const [userLevel, setUserLevel] = useState<number>(1);
  const [virtualDate, setVirtualDate] = useState<string>("02.26 (목)");
  const [newsPool, setNewsPool] = useState<NewsItem[]>([]);
  const [activeNews, setActiveNews] = useState<NewsItem[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);
  const isFirstLoadRef = React.useRef(true);
  const notifiedIdsRef = React.useRef<Set<number>>(new Set());
  const virtualDateRef = React.useRef<string>("02.26 (목)");

  // 로그인 핸들러
  const handleLogin = async (inputNickname: string) => {
    // 1. 백엔드에 로그인(회원가입) 요청
    const response = await loginUser(inputNickname);

    // 2. 백엔드가 준 진짜 숫자 ID 추출
    const realUserId = response?.user_id || response?.id || "1";

    localStorage.setItem("stocky_user_id", realUserId.toString());
    localStorage.setItem("stocky_nickname", inputNickname);

    setUserId(realUserId.toString());
    setNickname(inputNickname);
  };

  // 3. useEffect는 이제 loadData를 호출만 합니다.
  useEffect(() => {
    if (!userId) return;
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  // 거래 핸들러 (매수/매도)
  const handleBuy = async (stock: StockData, price: number, qty: number) => {
    if (!userId) return;
    loadData();
  };

  const handleSell = async (stock: StockData, price: number, qty: number) => {
    if (!userId) return;
    loadData();
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

  useEffect(() => {
    const saved = localStorage.getItem("stocky_notified_ids");
    if (saved) {
      const parsed = JSON.parse(saved).map((id: any) => Number(id));
      notifiedIdsRef.current = new Set(parsed);
    }
  }, []);

  const addNotification = (message: string, type: "buy" | "sell") => {
    const newNoti: NotificationItem = {
      id: Date.now() + Math.random(),
      message,
      // time: new Date().toLocaleTimeString("ko-KR", {
      //   hour: "2-digit",
      //   minute: "2-digit",
      // }),
      time: virtualDateRef.current,
      isRead: false,
      type,
    };
    setNotifications((prev) => [newNoti, ...prev]);
  };

  const loadData = async () => {
    if (!userId) return;

    // 자산 데이터 로드
    try {
      const data = await fetchMyPortfolio(userId);
      if (data && data.portfolio) {
        const mappedPortfolio = data.portfolio
          .filter((item: any) => item.quantity > 0)
          .map((item: any) => ({
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
    } catch (e) {
      console.warn("자산 로딩 실패", e);
    }

    // 프로필 로드
    try {
      const profileData = await fetchMyProfile(userId);
      if (profileData && profileData.level) {
        setLevel(profileData.level);
      }
    } catch (error) {}

    // 체결 감시 로직
    try {
      const allOrders = await fetchAllOrders(userId);
      let hasNewUpdate = false;

      allOrders.forEach((order: any) => {
        if (
          order.status === "FILLED" &&
          !notifiedIdsRef.current.has(order.id)
        ) {
          if (!isFirstLoadRef.current) {
            console.log(`🔔 알림 발송! Order ID: ${order.id}`);

            const side = order.side || order.order_type;
            const sideText =
              side === "BUY" || side === "매수" ? "매수" : "매도";

            addNotification(
              `${order.company_name} ${order.quantity}주 ${sideText} 체결 완료!`,
              side === "BUY" || side === "매수" ? "buy" : "sell",
            );
          } else {
            console.log(`🔕 첫 로딩이라 알림 생략 (ID: ${order.id})`);
          }

          // 알림 목록에 등록
          notifiedIdsRef.current.add(order.id);
          hasNewUpdate = true;
        }
      });

      if (hasNewUpdate) {
        localStorage.setItem(
          "stocky_notified_ids",
          JSON.stringify(Array.from(notifiedIdsRef.current)),
        );
      }
    } catch (error) {
      console.error("체결 감시 중 오류:", error);
    } finally {
      if (isFirstLoadRef.current) {
        console.log("✅ 첫 로딩 상태 해제");
        isFirstLoadRef.current = false;
      }
    }
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

  useEffect(() => {
    if (!userId) return;

    const START_DATE = new Date("2026-02-26T00:00:00");
    const REAL_MS_PER_VIRTUAL_DAY = 3 * 60 * 1000;

    // 유저별 저장소 열쇠(Key) 이름 설정
    const TIME_KEY = `stocky_${userId}_played_ms`;
    const ACTIVE_NEWS_KEY = `stocky_${userId}_active_news`;
    const NEWS_POOL_KEY = `stocky_${userId}_news_pool`;

    const initNews = async () => {
      try {
        const savedActive = localStorage.getItem(ACTIVE_NEWS_KEY);
        const savedPool = localStorage.getItem(NEWS_POOL_KEY);

        if (savedActive && savedPool) {
          const parsedActive = JSON.parse(savedActive);
          const parsedPool = JSON.parse(savedPool);

          if (parsedPool.length > 0) {
            setActiveNews(parsedActive);
            setNewsPool(parsedPool);
            return;
          }
        }

        const { fetchNewsList } = await import("./services/api");
        const allNews = await fetchNewsList();
        const newsByCompany: { [key: string]: any[] } = {};

        allNews.forEach((news: any) => {
          if (allNews.indexOf(news) === 0) {
          }

          const comp =
            news.company_name ||
            news.companyName ||
            news.ticker ||
            news.company ||
            "미분류";

          if (!newsByCompany[comp]) newsByCompany[comp] = [];

          const isDuplicate = newsByCompany[comp].some(
            (n: any) => n.title === news.title,
          );

          if (!isDuplicate && newsByCompany[comp].length < 20) {
            newsByCompany[comp].push(news);
          }
        });

        const balancedPool: any[] = [];
        let lastCompany = "";

        // 2. 도배 방지 섞기 로직
        while (true) {
          const availableCompanies = Object.keys(newsByCompany).filter(
            (comp) => newsByCompany[comp].length > 0,
          );
          if (availableCompanies.length === 0) break;

          let candidates = availableCompanies.filter(
            (comp) => comp !== lastCompany,
          );
          if (candidates.length === 0) {
            candidates = availableCompanies;
          }

          const randomComp =
            candidates[Math.floor(Math.random() * candidates.length)];
          const selectedNews = newsByCompany[randomComp].shift()!;
          balancedPool.push(selectedNews);
          lastCompany = randomComp;
        }

        // 3. 화면에 보여줄 초기 뉴스 4개 설정
        const TARGET_COMPANIES = [
          "삼송전자",
          "마이크로하드",
          "예진캐피탈",
          "진호랩",
        ];
        const initialActive: any[] = [];
        const finalPool: any[] = [];
        for (let i = 0; i < balancedPool.length; i++) {
          const news = balancedPool[i];
          const compName =
            news.company_name || news.companyName || news.ticker || "미분류";

          const isTarget = TARGET_COMPANIES.includes(compName);
          const isAlreadyAdded = initialActive.some(
            (n) =>
              (n.company_name || n.companyName || n.ticker || "미분류") ===
              compName,
          );

          if (isTarget && !isAlreadyAdded && initialActive.length < 4) {
            initialActive.push({ ...news, display_date: "02.26" });
          } else {
            finalPool.push(news);
          }
        }

        while (initialActive.length < 4 && finalPool.length > 0) {
          initialActive.push({ ...finalPool.shift(), display_date: "02.26" });
        }

        // 4. 상태 및 저장소 업데이트
        setActiveNews(initialActive);
        setNewsPool(finalPool);
        localStorage.setItem(ACTIVE_NEWS_KEY, JSON.stringify(initialActive));
        localStorage.setItem(NEWS_POOL_KEY, JSON.stringify(finalPool));
      } catch (error) {
        console.error("🚨 뉴스 로딩 실패:", error);
      }
    };

    if (activeNews.length === 0) {
      initNews();
    }

    let totalPlayedMs = parseInt(localStorage.getItem(TIME_KEY) || "0");
    let lastNewsTime = totalPlayedMs;

    const updateVirtualTime = () => {
      totalPlayedMs += 1000;
      localStorage.setItem(TIME_KEY, totalPlayedMs.toString());

      const elapsedVirtualDays = Math.floor(
        totalPlayedMs / REAL_MS_PER_VIRTUAL_DAY,
      );
      const currentDate = new Date(START_DATE.getTime());
      currentDate.setDate(currentDate.getDate() + elapsedVirtualDays);
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getDate()).padStart(2, "0");
      const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
      const dayOfWeek = daysOfWeek[currentDate.getDay()];

      const newVirtualDate = `${month}.${day} (${dayOfWeek})`;
      setVirtualDate(newVirtualDate);
      virtualDateRef.current = newVirtualDate;

      // 30초마다 뉴스 배포할 때마다 저장소 갱신
      if (totalPlayedMs - lastNewsTime >= 30000) {
        lastNewsTime = totalPlayedMs;

        setNewsPool((prevPool) => {
          if (prevPool.length === 0) return prevPool;

          const selectedNews = prevPool[0];
          const displayTime = newVirtualDate.slice(0, 5);
          const updatedNews = { ...selectedNews, display_date: displayTime };

          // 1. 화면(Active)에 새 뉴스를 띄우고 바로 저장!
          setActiveNews((prevActive) => {
            const newActive = [updatedNews, ...prevActive];
            localStorage.setItem(ACTIVE_NEWS_KEY, JSON.stringify(newActive));
            return newActive;
          });

          // 2. 창고(Pool)에서 첫 번째 하나 뺀 상태도 바로 저장!
          const newPool = prevPool.slice(1);
          localStorage.setItem(NEWS_POOL_KEY, JSON.stringify(newPool));

          return newPool;
        });
      }
    };

    const interval = setInterval(updateVirtualTime, 1000);
    return () => clearInterval(interval);
  }, [userId]);
  if (!userId) {
    return <LoginModal onLogin={handleLogin} />;
  }

  const uniqueActiveNews = activeNews.filter(
    (news, index, self) =>
      index === self.findIndex((t) => t.title === news.title),
  );

  // 닉네임이 있으면 라우터를 실행합니다.
  return (
    <Router>
      <Routes>
        <Route
          element={
            <Layout
              notifications={notifications}
              onMarkAsRead={handleMarkNotificationsAsRead}
              nickname={nickname}
              level={level}
              cash={cash}
              portfolio={livePortfolio}
              virtualDate={virtualDate}
              activeNews={uniqueActiveNews}
            />
          }
        >
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
          <Route path="/" element={<PopularStocks />} />

          <Route
            path="/stock/:symbol"
            element={
              <StockDetailWrapper
                stocks={stocks}
                watchlist={watchlist}
                onToggleWatchlist={handleToggleWatchlist}
                onBuy={handleBuy}
                onSell={handleSell}
                virtualDate={virtualDate}
              />
            }
          />
          <Route
            path="/news"
            element={<NewsContent activeNews={uniqueActiveNews} />}
          />
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
                virtualDate={virtualDate}
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
                virtualDate={virtualDate}
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
