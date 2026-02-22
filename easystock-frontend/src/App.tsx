import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Outlet,
  useParams,
} from "react-router-dom";

// 컴포넌트 임포트
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";

// 온보딩 컴포넌트 임포트
import TermsAgreement from "./components/onboarding/TermsAgreement";
import AccountOpening from "./components/onboarding/AccountOpening";
import AccountGuide from "./components/onboarding/AccountGuide";
import AppTour from "./components/onboarding/AppTour";

// 페이지/콘텐츠 임포트
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

// 데이터 및 API 임포트
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
  loginUser,
  fetchCompanies,
  fetchMyProfile,
  fetchAllOrders,
  NewsItem,
} from "./services/api";

// 1. Layout 컴포넌트
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
}: any) => {
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
    <div className="flex flex-col h-[100dvh] w-full max-w-[430px] mx-auto bg-[#e1eaf5] relative overflow-hidden shadow-2xl font-['Pretendard']">
      {!hideHeader && (
        <div className="shrink-0">
          <Header
            showProfile={isHome}
            notifications={notifications}
            onMarkAsRead={onMarkAsRead}
            nickname={nickname}
            level={level}
            userName={nickname}
            userLevel={`Lv.${level}`}
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
          <div className="flex w-full h-full">
            {isHome && (
              <div className="w-16 mr-3 flex flex-col h-full shrink-0">
                <Sidebar cash={cash} portfolio={portfolio} />
              </div>
            )}
            <div className="flex-1 h-full overflow-hidden">
              <Outlet context={{ activeNews }} />
            </div>
          </div>
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
  const [level, setLevel] = useState<number>(
    localStorage.getItem("app-tour-done") === "true" ? 2 : 1,
  );
  const [nickname, setNickname] = useState<string>(
    localStorage.getItem("stocky_nickname") || "투자자",
  );
  const userLevelString =
    level === 1 ? "lv.1 입문자" : `Lv.${level} 초보 투자자`;
  const [cash, setCash] = useState<number>(0);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(initialWatchlist);

  const [stocks, setStocks] = useState<StockData[]>([]);
  const [virtualDate, setVirtualDate] = useState<string>("02.26 (목)");
  const [newsPool, setNewsPool] = useState<NewsItem[]>([]);
  const [activeNews, setActiveNews] = useState<NewsItem[]>([]);

  // 온보딩 관련 상태
  const [onboardingStep, setOnboardingStep] = useState<
    "terms" | "opening" | "guide"
  >("terms");
  const [pendingNickname, setPendingNickname] = useState("");
  const [showTour, setShowTour] = useState(
    () => localStorage.getItem("app-tour-done") !== "true",
  );

  const isFirstLoadRef = React.useRef(true);
  const notifiedIdsRef = React.useRef<Set<number>>(new Set());
  const virtualDateRef = React.useRef<string>("02.26 (목)");

  // 3. 주식 상세 페이지 래퍼 컴포넌트
  const StockDetailWrapper = ({
    stocks,
    watchlist,
    onBuy,
    onSell,
    onToggleWatchlist,
    virtualDate,
  }: any) => {
    const { symbol } = useParams();

    const stock = stocks.find(
      (s: StockData) => s.symbol === symbol || s.name === symbol,
    );

    if (!stock) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500 font-bold">
          주식 정보를 불러오는 중입니다...
        </div>
      );
    }

    const isLiked = watchlist.some(
      (item: WatchlistItem) => item.name === stock.name,
    );

    return (
      <StockDetail
        stock={stock}
        isLiked={isLiked}
        onToggleWatchlist={() => onToggleWatchlist(stock)}
        onBack={() => window.history.back()}
        onBuy={onBuy}
        onSell={onSell}
        virtualDate={virtualDate}
        cash={cash}
        portfolio={portfolio}
      />
    );
  };

  // 로그인 핸들러 (진짜 백엔드 연동)
  const handleLogin = async (inputNickname: string) => {
    try {
      const response = await loginUser(inputNickname);
      const realUserId = response?.user_id || response?.id || "1";

      localStorage.setItem("stocky_user_id", realUserId.toString());
      localStorage.setItem("stocky_nickname", inputNickname);

      setUserId(realUserId.toString());
      setNickname(inputNickname);
    } catch (error) {
      console.error("로그인 실패:", error);
      // 에러 시 임시 처리
      setUserId("1");
      setNickname(inputNickname);
    }
  };

  // 데이터 폴링 (사용자 백엔드 로직 유지)
  useEffect(() => {
    if (!userId) return;
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadData = async () => {
    if (!userId) return;

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

    try {
      const profileData = await fetchMyProfile(userId);
      if (profileData && profileData.level) {
        setLevel(profileData.level);
      }
    } catch (error) {}

    try {
      const allOrders = await fetchAllOrders(userId);
      let hasNewUpdate = false;

      allOrders.forEach((order: any) => {
        if (
          order.status === "FILLED" &&
          !notifiedIdsRef.current.has(order.id)
        ) {
          if (!isFirstLoadRef.current) {
            const side = order.side || order.order_type;
            const sideText =
              side === "BUY" || side === "매수" ? "매수" : "매도";
            addNotification(
              `${order.company_name} ${order.quantity}주 ${sideText} 체결 완료!`,
              side === "BUY" || side === "매수" ? "buy" : "sell",
            );
          }
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
      if (isFirstLoadRef.current) isFirstLoadRef.current = false;
    }
  };

  // 주식 목록 로딩
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

  // 거래 및 관심종목 핸들러
  const handleBuy = async (stock: StockData, price: number, qty: number) => {
    if (userId) loadData();
  };
  const handleSell = async (stock: StockData, price: number, qty: number) => {
    if (userId) loadData();
  };

  const handleToggleWatchlist = (stock: StockData) => {
    const exists = watchlist.find((item) => item.name === stock.name);
    if (exists) {
      setWatchlist((prev) => prev.filter((item) => item.name !== stock.name));
    } else {
      setWatchlist((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: stock.name,
          price: stock.price,
          change: stock.change,
          isUp: stock.isUp,
          shares: "0주",
          badge: "관심",
          color: stock.color || "bg-gray-400",
          logoText: stock.logoText || stock.name.charAt(0),
        },
      ]);
    }
  };

  const handleMarkNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const addNotification = (message: string, type: "buy" | "sell") => {
    setNotifications((prev) => [
      {
        id: Date.now() + Math.random(),
        message,
        time: virtualDateRef.current,
        isRead: false,
        type,
      },
      ...prev,
    ]);
  };

  // 실시간 포트폴리오 매핑
  const livePortfolio = portfolio.map((item) => {
    const normalizedName = item.name === "삼성전자" ? "삼송전자" : item.name;
    const liveStock = stocks.find(
      (s) => s.name === normalizedName || s.symbol === normalizedName,
    );
    if (liveStock) {
      return {
        ...item,
        current_price:
          typeof liveStock.price === "number"
            ? liveStock.price
            : Number(liveStock.price.toString().replace(/[^0-9-]/g, "")),
      };
    }
    return item;
  });

  // 뉴스 혼합 및 가상 시간 흐름 로직
  useEffect(() => {
    if (!userId) return;

    const START_DATE = new Date("2026-02-26T00:00:00");
    const REAL_MS_PER_VIRTUAL_DAY = 3 * 60 * 1000;
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
          if (!isDuplicate && newsByCompany[comp].length < 20)
            newsByCompany[comp].push(news);
        });

        const balancedPool: any[] = [];
        let lastCompany = "";

        while (true) {
          const availableCompanies = Object.keys(newsByCompany).filter(
            (comp) => newsByCompany[comp].length > 0,
          );
          if (availableCompanies.length === 0) break;
          let candidates = availableCompanies.filter(
            (comp) => comp !== lastCompany,
          );
          if (candidates.length === 0) candidates = availableCompanies;
          const randomComp =
            candidates[Math.floor(Math.random() * candidates.length)];
          balancedPool.push(newsByCompany[randomComp].shift()!);
          lastCompany = randomComp;
        }

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

        setActiveNews(initialActive);
        setNewsPool(finalPool);
        localStorage.setItem(ACTIVE_NEWS_KEY, JSON.stringify(initialActive));
        localStorage.setItem(NEWS_POOL_KEY, JSON.stringify(finalPool));
      } catch (error) {
        console.error("🚨 뉴스 로딩 실패:", error);
      }
    };

    if (activeNews.length === 0) initNews();

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

      if (totalPlayedMs - lastNewsTime >= 30000) {
        lastNewsTime = totalPlayedMs;
        setNewsPool((prevPool) => {
          if (prevPool.length === 0) return prevPool;
          const selectedNews = prevPool[0];
          const displayTime = newVirtualDate.slice(0, 5);
          const updatedNews = { ...selectedNews, display_date: displayTime };

          setActiveNews((prevActive) => {
            const newActive = [updatedNews, ...prevActive];
            localStorage.setItem(ACTIVE_NEWS_KEY, JSON.stringify(newActive));
            return newActive;
          });

          const newPool = prevPool.slice(1);
          localStorage.setItem(NEWS_POOL_KEY, JSON.stringify(newPool));
          return newPool;
        });
      }
    };

    const interval = setInterval(updateVirtualTime, 1000);
    return () => clearInterval(interval);
  }, [userId]);

  // 쌍둥이 뉴스 중복 방지
  const uniqueActiveNews = activeNews.filter(
    (news, index, self) =>
      index === self.findIndex((t) => t.title === news.title),
  );

  // 온보딩 라우팅
  if (!userId) {
    if (onboardingStep === "terms") {
      return (
        <TermsAgreement
          onNext={() => setOnboardingStep("opening")}
          onSkip={() => setOnboardingStep("opening")}
        />
      );
    }
    if (onboardingStep === "guide") {
      return <AccountGuide onBack={() => setOnboardingStep("opening")} />;
    }
    if (onboardingStep === "opening") {
      return (
        <AccountOpening
          onBack={() => setOnboardingStep("terms")}
          onNext={() => handleLogin(pendingNickname || "투자자")}
          onShowGuide={() => setOnboardingStep("guide")}
          onSkip={() => handleLogin("투자자")}
          onNicknameChange={(name) => setPendingNickname(name)}
        />
      );
    }
  }

  // 메인 라우터
  return (
    <>
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
            <Route
              path="/ranking"
              element={<RankingContent userName={nickname} />}
            />
            <Route
              path="/chatbot"
              element={<ChatbotContent onBack={() => {}} userName={nickname} />}
            />
            <Route
              path="/community"
              element={<CommunityContent userName={nickname} />}
            />
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
                  activeNews={activeNews}
                  cash={cash}
                  portfolio={livePortfolio}
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
                  userName={nickname}
                  userLevel={userLevelString}
                />
              </Layout>
            }
          />
        </Routes>
      </Router>

      {/* 튜토리얼 (온보딩 완료 후 띄우기) */}
      {userId && showTour && (
        <AppTour
          onComplete={() => {
            // 1. 튜토리얼 창 닫기
            setShowTour(false);

            // 2. 튜토리얼 완료했다고 내 컴퓨터(로컬스토리지)에 저장하기
            localStorage.setItem("app-tour-done", "true");

            // 3. 레벨을 즉시 2로 올리기! (새로고침 없이 짠! 바뀝니다)
            setLevel(2);
          }}
        />
      )}
    </>
  );
};

export default App;
