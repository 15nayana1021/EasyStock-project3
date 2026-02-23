import React, { useState, useEffect, useRef, memo } from "react";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Heart,
  Clock,
  X,
  Delete,
} from "lucide-react";
import { StockData } from "../types";
import {
  fetchStockChart,
  fetchOrderBook,
  placeOrder,
  fetchMyOrders,
  cancelOrder as apiCancelOrder,
  fetchNews,
  fetchNewsDetail,
  fetchCommunityPosts,
  fetchMentorAdvice,
  postCommunityMessage,
} from "../services/api";

interface OHLCData {
  open: number;
  high: number;
  low: number;
  close: number;
  dateLabel: string;
}

interface OrderBookItem {
  price: number;
  volume: number;
  type: "ask" | "bid";
}

interface PendingOrder {
  id: number;
  type: "buy" | "sell";
  name: string;
  qty: string;
  price: string;
}

interface StockDetailProps {
  stock: any;
  isLiked: boolean;
  onToggleWatchlist: () => void;
  onBack: () => void;
  onBuy: (stock: StockData, price: number, qty: number) => void;
  onSell: (stock: StockData, price: number, qty: number) => void;
  activeNews: any[];
  virtualDate: string;
  cash?: number;
  portfolio?: any[];
  externalTab?: string;
  onTabChange?: (tab: string) => void;
}

const StockDetail: React.FC<StockDetailProps> = ({
  stock,
  isLiked,
  onToggleWatchlist,
  onBack,
  onBuy,
  onSell,
  virtualDate,
  activeNews,
  cash = 0,
  portfolio = [],
  externalTab,
  onTabChange,
}) => {
  const [localActiveTab, setLocalActiveTab] = useState("차트");
  const activeTab = externalTab || localActiveTab;
  const setActiveTab = onTabChange || setLocalActiveTab;
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [communityInput, setCommunityInput] = useState("");
  const [mentorAdvice, setMentorAdvice] = useState<any | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [selectedNews, setSelectedNews] = useState<any | null>(null);
  const [visibleNewsCount, setVisibleNewsCount] = useState(4);
  const ownedStock = portfolio.find((item: any) => item.name === stock.name);
  const availableQty = ownedStock
    ? ownedStock.quantity || ownedStock.sharesCount || 0
    : 0;

  // 주문 모달 상태
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeTab, setTradeTab] = useState<"buy" | "sell" | "pending">("buy");

  // 키패드 입력 상태
  const [orderAmount, setOrderAmount] = useState("1");
  const [orderPrice, setOrderPrice] = useState("0");
  const [focusedField, setFocusedField] = useState<"price" | "amount">("price");
  const [isFirstKeypress, setIsFirstKeypress] = useState(true);

  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);
  const [realNews, setRealNews] = useState<any[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);

  // 차트 및 호가 상태
  const [chartPeriod, setChartPeriod] = useState<"1일" | "1주" | "1달" | "1년">(
    "1일",
  );
  const [hoverData, setHoverData] = useState<{
    price: number;
    change: number;
    changePercent: number;
    y: number;
    x: number;
    date: string;
  } | null>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [candleData, setCandleData] = useState<OHLCData[]>([]);
  const [orderBookData, setOrderBookData] = useState<OrderBookItem[]>([]);

  const currentPriceRaw = parseInt(stock.price.replace(/[^0-9]/g, "")) || 0;
  const [currentPrice, setCurrentPrice] = useState<number>(currentPriceRaw);
  const changePercentRaw =
    parseFloat(stock.change.replace(/[^0-9.-]/g, "")) || 0;
  const prevClose = Math.round(currentPriceRaw / (1 + changePercentRaw / 100));
  const isStockUp = stock.isUp;
  const currentChangePercent =
    prevClose > 0 ? ((currentPrice - prevClose) / prevClose) * 100 : 0;
  const isCurrentlyUp = currentChangePercent >= 0;
  const currentDisplayChange = `${isCurrentlyUp ? "▲" : "▼"} ${Math.abs(currentChangePercent).toFixed(2)}%`;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rawRelatedNews = (activeNews || []).filter(
    (n: any) =>
      n.company_name === stock.name ||
      n.title?.includes(stock.name) ||
      n.content?.includes(stock.name),
  );

  const handleNewsClick = async (news: any) => {
    try {
      if (news.id) {
        const fullNews = await fetchNewsDetail(news.id);
        setSelectedNews({ ...news, ...fullNews });
      } else {
        setSelectedNews(news);
      }
    } catch (error) {
      console.error("뉴스 전문 로딩 실패:", error);
      setSelectedNews(news);
    }
  };

  const relatedNews = rawRelatedNews.filter(
    (news: any, index: number, self: any[]) =>
      index === self.findIndex((t) => t.id === news.id),
  );

  useEffect(() => {
    if (activeTab === "토론") {
      loadCommunity();
    } else if (activeTab === "조언") {
      loadMentorAdvice();
    }
  }, [activeTab]);

  const getTickerCode = (name: string) => {
    const tickerMap: Record<string, string> = {
      삼송전자: "SS011",
      재웅시스템: "JW004",
      에이펙스테크: "AT010",
      마이크로하드: "MH012",
      소현컴퍼니: "SH001",
      넥스트데이터: "ND008",
      진호랩: "JH005",
      상은테크놀로지: "SE002",
      인사이트애널리틱스: "IA009",
      예진캐피탈: "YJ003",
      선우솔루션: "SW006",
      퀀텀디지털: "QD007",
    };
    // 사전에 있으면 정확한 암호를, 없으면 혹시 모를 기본값을 반환합니다.
    return tickerMap[name] || stock.symbol || name;
  };

  const loadCommunity = async () => {
    const targetId = getTickerCode(stock.name);
    const posts = await fetchCommunityPosts(targetId);
    setCommunityPosts(posts);
  };

  const loadMentorAdvice = async () => {
    if (mentorAdvice) return;
    setIsLoadingAdvice(true);
    const targetId = getTickerCode(stock.name);
    const advice = await fetchMentorAdvice(targetId);
    setMentorAdvice(advice);
    setIsLoadingAdvice(false);
  };

  const handlePostCommunity = async () => {
    if (!communityInput.trim()) return;
    await postCommunityMessage("개미투자자", communityInput, stock.symbol);
    setCommunityInput("");
    loadCommunity();
  };

  useEffect(() => {
    if (stock) setOrderPrice(currentPriceRaw.toLocaleString());
  }, [stock, currentPriceRaw]);

  useEffect(() => {
    // 한글 -> 영문 Ticker 변환
    const ticker = getTickerCode(stock.name);

    const loadRealTimeData = async (showLoading = false) => {
      if (showLoading) setIsLoadingChart(true);

      const periodMap: Record<string, string> = {
        "1일": "1d",
        "1주": "1w",
        "1달": "1m",
        "1년": "1y",
      };

      try {
        const chartData = await fetchStockChart(
          ticker,
          periodMap[chartPeriod] || "1d",
        );

        if (chartData && chartData.length > 0) {
          const mapped: OHLCData[] = chartData.map((d: any) => ({
            open: d.open || d.price || 0,
            high: d.high || d.price || 0,
            low: d.low || d.price || 0,
            close: d.close || d.price || 0,
            dateLabel: d.time ? d.time.slice(11, 16) : "00:00",
          }));
          setCandleData(mapped);
        } else {
          const fallbackData: OHLCData[] = [];
          let tempPrice = currentPriceRaw * 0.95;
          const now = new Date();

          for (let i = 20; i >= 0; i--) {
            const open = tempPrice;
            const close =
              i === 0
                ? currentPriceRaw
                : open + (Math.random() - 0.45) * (currentPriceRaw * 0.02);
            const high =
              Math.max(open, close) + Math.random() * (currentPriceRaw * 0.01);
            const low =
              Math.min(open, close) - Math.random() * (currentPriceRaw * 0.01);

            const timeStr =
              new Date(now.getTime() - i * 60 * 60 * 1000).getHours() + "시";
            fallbackData.push({ open, high, low, close, dateLabel: timeStr });
            tempPrice = close;
          }
          setCandleData(fallbackData);
        }
        const orderBook = await fetchOrderBook(ticker);
        if (orderBook) {
          setCurrentPrice(orderBook.current_price);

          // 1. 백엔드 데이터에 'ask(매도)'와 'bid(매수)' 이름표를 강제로 붙여줍니다!
          const formattedAsks = (orderBook.asks || []).map((item: any) => ({
            price: item.price || 0,
            volume: item.volume || item.quantity || 0,
            type: "ask",
          }));

          const formattedBids = (orderBook.bids || []).map((item: any) => ({
            price: item.price || 0,
            volume: item.volume || item.quantity || 0,
            type: "bid",
          }));

          // 2. 보기 좋게 정렬해서 화면(setOrderBookData)에 넘겨줍니다.
          setOrderBookData([
            ...formattedAsks.sort((a: any, b: any) => b.price - a.price),
            ...formattedBids.sort((a: any, b: any) => b.price - a.price),
          ]);
        }
      } catch (e) {
      } finally {
        if (showLoading) setIsLoadingChart(false);
      }
    };
    loadRealTimeData(true);
    const interval = setInterval(() => loadRealTimeData(false), 3000);
    return () => clearInterval(interval);
  }, [chartPeriod, stock]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (activeTab === "뉴스") {
      const loadRealNews = async () => {
        try {
          setRealNews(relatedNews);
        } catch (e) {
          console.error("뉴스 불러오기 실패:", e);
        }
      };

      setIsLoadingNews(true);
      loadRealNews().finally(() => setIsLoadingNews(false));

      intervalId = setInterval(() => {
        loadRealNews();
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTab, stock.name]);

  useEffect(() => {
    const userId = localStorage.getItem("stocky_user_id") || "1";
    if (tradeTab === "pending" && isTradeModalOpen) {
      fetchMyOrders(userId).then((orders) => {
        const tickerToName: Record<string, string> = {
          SS011: "삼송전자",
          JW004: "재웅시스템",
          AT010: "에이펙스테크",
          MH012: "마이크로하드",
          SH001: "소현컴퍼니",
          ND008: "넥스트데이터",
          JH005: "진호랩",
          SE002: "상은테크놀로지",
          IA009: "인사이트애널리틱스",
          YJ003: "예진캐피탈",
          SW006: "선우솔루션",
          QD007: "퀀텀디지털",
        };

        setPendingOrders(
          orders
            .filter((o: any) => o.status === "PENDING")
            .map((o: any) => {
              const isBuy =
                String(o.side || o.order_type).toUpperCase() === "BUY";
              const rawName = o.company_name || o.ticker || o.name || "";
              const displayName = tickerToName[rawName] || rawName;

              return {
                id: o.id,
                type: isBuy ? "buy" : "sell",
                name: displayName,
                qty: o.quantity || o.qty,
                price: o.price,
              };
            }),
        );
      });
    }
  }, [tradeTab, isTradeModalOpen]);

  const handleKeypadPress = (key: string) => {
    const isAmount = focusedField === "amount";
    const currentVal = isAmount ? orderAmount : orderPrice.replace(/,/g, "");
    let newVal = currentVal;

    if (isFirstKeypress) {
      if (key === "back") {
        newVal = currentVal.slice(0, -1) || "0";
      } else {
        newVal = key === "00" ? "0" : key;
      }
      setIsFirstKeypress(false);
    } else {
      if (key === "back") {
        newVal = currentVal.slice(0, -1) || "0";
      } else if (key === "00") {
        newVal = currentVal === "0" ? "0" : currentVal + "00";
      } else {
        newVal = currentVal === "0" ? key : currentVal + key;
      }
    }

    if (isAmount) setOrderAmount(newVal);
    else setOrderPrice((parseInt(newVal) || 0).toLocaleString());
  };

  const handleFocusField = (field: "price" | "amount") => {
    setFocusedField(field);
    setIsFirstKeypress(true);
  };

  const executeOrder = async () => {
    const price = parseInt(orderPrice.replace(/,/g, ""));
    const qty = parseInt(orderAmount);
    if (price <= 0 || qty <= 0) {
      alert("가격과 수량을 확인해주세요.");
      return;
    }

    setIsOrdering(true);
    try {
      const userId = localStorage.getItem("stocky_user_id") || "1";
      const res = await placeOrder(
        stock.symbol,
        tradeTab === "buy" ? "BUY" : "SELL",
        price,
        qty,
        userId,
        virtualDate,
      );
      if (res.success !== false) {
        if (tradeTab === "buy") onBuy(stock, price, qty);
        else onSell(stock, price, qty);
        alert(
          `${stock.name} ${qty}주 ${tradeTab === "buy" ? "매수" : "매도"} 접수 완료!`,
        );
        setIsTradeModalOpen(false);
      } else {
        alert("주문 실패: " + res.message);
      }
    } finally {
      setIsOrdering(false);
    }
  };

  const renderChart = () => {
    const prices =
      candleData.length > 0
        ? candleData.flatMap((d) => [d.high, d.low])
        : [currentPriceRaw];
    const rawMin = Math.min(...prices);
    const rawMax = Math.max(...prices);

    const minVal =
      rawMin === Infinity || isNaN(rawMin)
        ? currentPriceRaw * 0.95
        : rawMin * 0.95;
    const maxVal =
      rawMax === -Infinity || isNaN(rawMax)
        ? currentPriceRaw * 1.05
        : rawMax * 1.05;
    const range = Math.max(maxVal - minVal, 1);

    const containerHeight = 260;
    const padding = { top: 20, bottom: 35, left: 0, right: 50 };
    const chartHeight = containerHeight - padding.bottom - padding.top;

    const candleWidth = 12;
    const minChartWidth = window.innerWidth;
    const calculatedWidth = Math.max(
      minChartWidth,
      candleData.length * candleWidth,
    );
    const chartWidth = calculatedWidth - padding.right;

    const getY = (price: number) => {
      return (
        containerHeight -
        padding.bottom -
        ((price - minVal) / range) * chartHeight
      );
    };

    const handleMouseMove = (
      e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>,
    ) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();

      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const x = clientX - rect.left;

      if (x > chartWidth) {
        setHoverData(null);
        return;
      }

      const index = Math.floor((x / chartWidth) * candleData.length);

      if (index >= 0 && index < candleData.length) {
        const d = candleData[index];
        const diff = d.close - d.open;
        const diffPercent = (diff / d.open) * 100;
        const candleCenter =
          index * (chartWidth / candleData.length) +
          chartWidth / candleData.length / 2;

        setHoverData({
          price: d.close,
          change: diff,
          changePercent: diffPercent,
          y: getY(d.close),
          x: candleCenter,
          date: d.dateLabel,
        });
      }
    };

    return (
      <div className="bg-white rounded-[2rem] pt-6 pb-4 shadow-sm border border-gray-100 shrink-0 flex flex-col relative overflow-hidden mb-2 min-h-[250px]">
        {/* Y축 가격 라벨 */}
        <div
          className="absolute right-0 flex flex-col text-[10px] font-bold text-gray-400 pointer-events-none text-right pr-3 z-20"
          style={{
            top: "30px",
            height: "180px",
            justifyContent: "space-between",
          }}
        >
          <span>{Math.round(maxVal).toLocaleString()}</span>
          <span>{Math.round(minVal + range * 0.75).toLocaleString()}</span>
          <span>{Math.round(minVal + range * 0.5).toLocaleString()}</span>
          <span>{Math.round(minVal + range * 0.25).toLocaleString()}</span>
          <span>{Math.round(minVal).toLocaleString()}</span>
        </div>

        {/* 차트 스크롤 영역 */}
        <div
          className="flex-1 overflow-x-auto hide-scrollbar relative w-full"
          ref={scrollContainerRef}
        >
          <svg
            width={calculatedWidth}
            height={containerHeight}
            className="overflow-visible touch-pan-x"
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
            onMouseLeave={() => setHoverData(null)}
            onTouchEnd={() => setHoverData(null)}
            style={{ cursor: "crosshair" }}
          >
            {/* 가로 점선 (그리드) */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = containerHeight - padding.bottom - ratio * chartHeight;
              return (
                <line
                  key={i}
                  x1={0}
                  y1={y}
                  x2={calculatedWidth}
                  y2={y}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
              );
            })}

            {/* X축 시간 라벨 */}
            {candleData.map((d, i) => {
              if (i % 5 !== 0) return null;
              const x =
                i * (chartWidth / candleData.length) +
                chartWidth / candleData.length / 2;
              return (
                <text
                  key={i}
                  x={x}
                  y={containerHeight - 15}
                  textAnchor="middle"
                  fill="#9CA3AF"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {d.dateLabel}
                </text>
              );
            })}

            {/* 캔들스틱 (봉 차트) 그리기 */}
            {candleData.map((d, i) => {
              const isUp = d.close >= d.open;
              const color = isUp ? "#E53935" : "#1E88E5";
              const barW = chartWidth / candleData.length;
              const wickX = i * barW + barW / 2;
              const bodyX = i * barW + 2;
              const bodyWidth = Math.max(barW - 4, 2);

              const yOpen = getY(d.open);
              const yClose = getY(d.close);

              return (
                <g key={i}>
                  {/* 꼬리 */}
                  <line
                    x1={wickX}
                    y1={getY(d.high)}
                    x2={wickX}
                    y2={getY(d.low)}
                    stroke={color}
                    strokeWidth="1"
                  />
                  {/* 몸통 */}
                  <rect
                    x={bodyX}
                    y={Math.min(yOpen, yClose)}
                    width={bodyWidth}
                    height={Math.max(Math.abs(yOpen - yClose), 1)}
                    fill={color}
                    rx="1"
                  />
                </g>
              );
            })}

            {/* 누르거나 마우스 올렸을 때 나타나는 십자선 & 가격표 */}
            {hoverData && (
              <g>
                {/* 십자선 */}
                <line
                  x1={hoverData.x}
                  y1={padding.top}
                  x2={hoverData.x}
                  y2={containerHeight - padding.bottom}
                  stroke="#004FFE"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.8"
                />
                <line
                  x1={0}
                  y1={hoverData.y}
                  x2={calculatedWidth}
                  y2={hoverData.y}
                  stroke="#004FFE"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.8"
                />

                {/* 가격 뱃지 */}
                <g
                  transform={`translate(${hoverData.x + 10}, ${hoverData.y - 12})`}
                >
                  <rect
                    x="0"
                    y="0"
                    width="60"
                    height="24"
                    rx="4"
                    fill="#004FFE"
                    filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.1))"
                  />
                  <text
                    x="30"
                    y="16"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill="white"
                  >
                    {Math.round(hoverData.price).toLocaleString()}
                  </text>
                </g>

                {/* 시간 뱃지 */}
                <g
                  transform={`translate(${hoverData.x}, ${containerHeight - padding.bottom + 5})`}
                >
                  <rect
                    x="-20"
                    y="0"
                    width="40"
                    height="18"
                    rx="4"
                    fill="#374151"
                  />
                  <text
                    x="0"
                    y="13"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill="white"
                  >
                    {hoverData.date}
                  </text>
                </g>
              </g>
            )}
          </svg>
        </div>

        {/* 하단 기간 선택 버튼 */}
        <div className="px-6 pb-2 flex items-end justify-between mt-2">
          <div className="flex bg-gray-100 p-1 rounded-xl space-x-1">
            {["1일", "1주", "1달", "1년"].map((period) => (
              <button
                key={period}
                onClick={() => setChartPeriod(period as any)}
                className={`px-3 py-1 text-[11px] font-black rounded-lg ${chartPeriod === period ? "bg-white text-[#004FFE] shadow-sm" : "text-gray-400"}`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const handleCancelOrder = async (id: number) => {
    if (window.confirm("정말로 주문을 취소하시겠습니까?")) {
      try {
        const res = await apiCancelOrder(id);
        if (res && res.success !== false) {
          setPendingOrders((prev) => prev.filter((order) => order.id !== id));
          alert("주문이 취소되었습니다.");
        } else {
          alert("취소 실패: " + (res?.message || "알 수 없는 오류"));
        }
      } catch (error) {
        console.error("주문 취소 중 오류 발생:", error);
        alert("주문 취소 중 문제가 발생했습니다.");
      }
    }
  };

  const renderKeypadModal = () => {
    if (!isTradeModalOpen) return null;
    const keypad = [
      ["1", "2", "3"],
      ["4", "5", "6"],
      ["7", "8", "9"],
      ["00", "0", "back"],
    ];
    const isBuy = tradeTab === "buy";

    return (
      <div className="absolute inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-gray-100 shrink-0">
          <div className="flex space-x-6">
            {[
              { key: "buy", label: "매수" },
              { key: "sell", label: "매도" },
              { key: "pending", label: "미체결" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTradeTab(tab.key as any)}
                className={`pb-2 text-lg font-black ${
                  tradeTab === tab.key
                    ? tab.key === "buy"
                      ? "text-[#E53935] border-b-2 border-[#E53935]"
                      : tab.key === "sell"
                        ? "text-[#1E88E5] border-b-2 border-[#1E88E5]"
                        : "text-gray-800 border-b-2 border-gray-800"
                    : "text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsTradeModalOpen(false)}
            className="p-2 -mr-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {tradeTab === "pending" ? (
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {pendingOrders.length === 0 ? (
              <div className="text-center text-gray-400 font-bold py-20 flex flex-col items-center">
                <Clock size={40} className="mb-3 opacity-20" />
                <p>대기 중인 주문이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map((order) => {
                  const typeValue = String(
                    order.side ||
                      order.type ||
                      order.order_type ||
                      order.trade_type ||
                      order.orderType ||
                      "",
                  );
                  const isBuy =
                    typeValue.toUpperCase() === "BUY" || typeValue === "매수";

                  return (
                    <div
                      key={order.id}
                      className="bg-white border border-gray-100 rounded-2xl p-5 flex justify-between items-center shadow-sm"
                    >
                      <div className="flex-1">
                        <div
                          className={`text-sm font-black mb-1 ${isBuy ? "text-[#E53935]" : "text-[#1E88E5]"}`}
                        >
                          {isBuy ? "매수" : "매도"}
                        </div>
                        <div className="text-xs text-gray-500 font-bold">
                          <span className="text-gray-800">
                            {order.company_name || order.name}
                          </span>{" "}
                          · {order.quantity || order.qty}주 ·{" "}
                          {Number(order.price).toLocaleString()}원
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="p-2.5 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors active:scale-95"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-5 bg-gray-50">
            <div className="bg-white rounded-2xl p-5 mb-3 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400 font-bold">
                  주문 가격
                </span>
                <span className="text-xs text-gray-500 font-bold">
                  현재가 {currentPrice.toLocaleString()}원
                </span>
              </div>
              <div
                onClick={() => handleFocusField("price")}
                className={`text-3xl font-black py-1 ${focusedField === "price" ? (isBuy ? "text-[#E53935]" : "text-[#1E88E5]") : "text-gray-800"}`}
              >
                {orderPrice}원
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 mb-4 border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400 font-bold mb-2">수량</div>
                <div
                  className={`text-xs font-bold ${isBuy ? "text-[#E53935]" : "text-[#1E88E5]"}`}
                >
                  {isBuy
                    ? `매수가능 ${cash?.toLocaleString() || 0}원 >`
                    : `매도가능 ${availableQty}주 >`}
                </div>
              </div>
              <div
                onClick={() => handleFocusField("amount")}
                className={`text-2xl font-black text-right ${focusedField === "amount" ? (isBuy ? "text-[#E53935]" : "text-[#1E88E5]") : "text-gray-800"}`}
              >
                {orderAmount}주
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 flex-1 max-h-[300px]">
              {keypad.flat().map((k, i) => (
                <button
                  key={i}
                  onClick={() => handleKeypadPress(k)}
                  className="bg-white text-2xl font-black text-gray-800 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-center active:bg-gray-100 transition-colors"
                >
                  {k === "back" ? (
                    <Delete size={24} className="text-gray-500" />
                  ) : (
                    k
                  )}
                </button>
              ))}
            </div>

            <div className="flex space-x-3 mt-4 shrink-0">
              <button
                onClick={() => setIsTradeModalOpen(false)}
                className="w-1/3 py-4.5 bg-[#94A3B8] text-white rounded-2xl font-black text-lg shadow-sm active:scale-95 transition-all"
              >
                취소
              </button>
              <button
                onClick={executeOrder}
                disabled={isOrdering}
                className={`flex-1 py-4.5 text-white rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center ${isBuy ? "bg-[#E53935] shadow-red-200" : "bg-[#1E88E5] shadow-blue-200"}`}
              >
                {isOrdering ? (
                  <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                ) : (
                  "입력"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F8FC] relative overflow-hidden">
      {/* 1. 메인 헤더 */}
      <div
        id="stock-detail-info"
        className="px-5 pt-6 pb-2 flex items-center justify-between shrink-0 bg-white"
      >
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
        >
          <ChevronLeft size={28} />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-black text-gray-800">{stock.name}</h2>

          {/* stock.price 대신 실시간 가격 적용 */}
          <span className="text-xs font-bold text-gray-400">
            {currentPrice.toLocaleString()}원
          </span>
        </div>
        <button
          onClick={onToggleWatchlist}
          className={`p-2 -mr-2 rounded-full ${isLiked ? "text-[#E53935]" : "text-gray-300"}`}
        >
          <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
        </button>
      </div>

      {/* 2. 주가 표시 */}
      <div className="bg-white flex flex-col px-6">
        <div className="text-center py-6">
          <h1 className="text-4xl font-black text-[#1A334E] mb-1">
            {currentPrice.toLocaleString()}원
          </h1>
          <div
            className={`text-sm font-black flex items-center justify-center ${isCurrentlyUp ? "text-[#E53935]" : "text-[#1E88E5]"}`}
          >
            {currentDisplayChange}
          </div>
        </div>
        <div id="stock-detail-tabs" className="flex border-b border-gray-100">
          {["차트", "호가", "뉴스", "조언", "토론"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${
                activeTab === tab
                  ? "text-[#004FFE] border-b-2 border-[#004FFE]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 3. 메인 콘텐츠 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar bg-[#F5F8FC] p-5">
        {/* === 차트 탭 === */}
        {activeTab === "차트" && (
          <div id="stock-detail-chart" className="flex flex-col">
            {renderChart()}
            <div className="mt-4 flex items-center space-x-4 shrink-0">
              <button
                onClick={() => {
                  setTradeTab("sell");
                  setIsTradeModalOpen(true);
                }}
                className="flex-1 bg-white border border-[#004FFE]/20 rounded-[1.5rem] py-4 font-black text-[#004FFE] shadow-sm active:scale-95 transition-all text-lg"
              >
                팔게요
              </button>
              <button
                onClick={() => {
                  setTradeTab("buy");
                  setIsTradeModalOpen(true);
                }}
                className="flex-1 bg-[#004FFE] text-white rounded-[1.5rem] py-4 font-black text-lg shadow-lg shadow-[#004FFE]/20 active:scale-95 transition-all"
              >
                살게요
              </button>
            </div>
          </div>
        )}

        {/* === 호가 탭 === */}
        {activeTab === "호가" && (
          <div
            id="stock-detail-orderbook"
            className="bg-white rounded-[1.5rem] p-3 shadow-sm border border-gray-100 flex flex-col animate-in fade-in"
          >
            {/* 호가 테이블 헤더 */}
            <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-3 px-2 pt-2 border-b border-gray-50 pb-2">
              <span className="flex-1 text-left">매도잔량</span>
              <span className="flex-1 text-center">호가</span>
              <span className="flex-1 text-right">매수잔량</span>
            </div>

            {/* 호가 리스트 */}
            <div className="flex flex-col">
              {orderBookData && orderBookData.length > 0 ? (
                orderBookData.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex justify-between items-center py-3 px-2 mb-1 rounded-lg ${
                      item.type === "ask" ? "bg-blue-50/40" : "bg-red-50/40"
                    }`}
                  >
                    {/* 매도잔량 (파란색) */}
                    <span
                      className={`flex-1 text-left text-[13px] font-bold ${
                        item.type === "ask"
                          ? "text-blue-500"
                          : "text-transparent"
                      }`}
                    >
                      {item.type === "ask" ? item.volume.toLocaleString() : ""}
                    </span>

                    {/* 중앙 호가 (파란색 or 빨간색) */}
                    <span
                      className={`flex-1 text-center text-[15px] font-black ${
                        item.type === "ask" ? "text-blue-600" : "text-red-500"
                      }`}
                    >
                      {item.price.toLocaleString()}
                    </span>

                    {/* 매수잔량 (빨간색) */}
                    <span
                      className={`flex-1 text-right text-[13px] font-bold ${
                        item.type === "bid"
                          ? "text-red-500"
                          : "text-transparent"
                      }`}
                    >
                      {item.type === "bid" ? item.volume.toLocaleString() : ""}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-gray-400 font-bold text-sm">
                  호가 데이터가 없습니다.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 뉴스 탭 */}
        {activeTab === "뉴스" && (
          <div
            id="stock-detail-news"
            className="space-y-3 animate-in fade-in slide-in-from-bottom-2 pb-10"
          >
            {/* ... 내용 유지 ... */}
            {relatedNews.length > 0 ? (
              <>
                {relatedNews
                  .slice(0, visibleNewsCount)
                  .map((news: any, idx) => (
                    <div
                      key={news.id || idx}
                      onClick={() => handleNewsClick(news)}
                      className="cursor-pointer bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 active:scale-95 transition-transform"
                    >
                      <h3 className="text-sm font-black text-[#1A334E] mb-1.5 line-clamp-2">
                        {news.title}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium line-clamp-2 mb-3">
                        {news.summary ||
                          news.content ||
                          "뉴스 상세 내용이 없습니다."}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold">
                        <span>{news.source || "Easystock 경제"}</span>
                        <span>
                          {news.display_date || news.published_at || "방금 전"}
                        </span>
                      </div>
                    </div>
                  ))}

                {/* 더보기 / 접기 버튼 */}
                <div className="flex gap-2 pt-2">
                  {relatedNews.length > visibleNewsCount && (
                    <button
                      onClick={() => setVisibleNewsCount((prev) => prev + 5)}
                      className="flex-1 py-3 bg-white hover:bg-gray-50 rounded-xl flex items-center justify-center space-x-2 text-gray-500 font-bold text-xs transition-all border border-gray-100 shadow-sm"
                    >
                      <span>
                        더보기 ({relatedNews.length - visibleNewsCount}개)
                      </span>
                    </button>
                  )}
                  {visibleNewsCount > 3 && (
                    <button
                      onClick={() => setVisibleNewsCount(3)}
                      className="flex-1 py-3 bg-white hover:bg-gray-50 rounded-xl flex items-center justify-center space-x-2 text-gray-500 font-bold text-xs transition-all border border-gray-100 shadow-sm"
                    >
                      <span>접기</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center text-gray-400 py-10 font-bold">
                관련 뉴스가 없습니다.
              </div>
            )}

            {/* 뉴스 모달 */}
            {selectedNews && (
              <div className="fixed inset-x-0 mx-auto top-0 bottom-[90px] w-full max-w-[430px] z-[100] flex flex-col bg-[#e1eaf5] animate-in slide-in-from-bottom-12 duration-300 rounded-b-3xl overflow-hidden">
                <div className="shrink-0 flex items-center px-4 pt-4 h-[70px] bg-[#e1eaf5] z-10">
                  <button
                    onClick={() => setSelectedNews(null)}
                    className="flex items-center text-[#1A334E] hover:text-[#004FFE] transition-colors text-[15px] font-black"
                  >
                    ← 주식 화면으로 돌아가기
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-6 hide-scrollbar">
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-blue-50 relative min-h-full">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-[#004FFE] bg-[#004FFE]/10 px-2 py-1 rounded-full">
                        {selectedNews.category || "일반"}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold">
                        {selectedNews.display_date ||
                          selectedNews.published_at ||
                          "방금 전"}
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold text-[#1A334E] leading-tight mb-6 break-keep">
                      {selectedNews.title}
                    </h2>
                    <div className="text-[15px] text-gray-700 leading-loose whitespace-pre-wrap font-medium">
                      {selectedNews.content ||
                        selectedNews.summary ||
                        selectedNews.full_text ||
                        "내용이 없습니다."}
                    </div>
                    <div className="mt-8 pt-4 border-t border-gray-100 text-right text-xs text-gray-400 font-bold">
                      Source: {selectedNews.source || "Stocky News"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. 조언 탭 */}
        {activeTab === "조언" && (
          <div
            id="stock-detail-advice"
            className="flex-1 flex flex-col bg-[#CFE3FA] relative -mx-5 -mb-5 h-[calc(100%+1.25rem)] overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto pl-5 pr-4 pt-8 space-y-6 pb-32 hide-scrollbar flex flex-col">
              {isLoadingAdvice ? (
                <div className="flex flex-col items-center justify-center h-full opacity-60 animate-pulse">
                  <p className="text-[#1A334E] font-black text-sm">
                    멘토들이 분석 리포트를 작성 중입니다...
                  </p>
                </div>
              ) : mentorAdvice ? (
                <>
                  <div className="flex justify-center mb-2">
                    <span className="bg-white/40 text-[#1A334E] px-4 py-1.5 rounded-full text-[10px] font-black shadow-sm border border-white/50">
                      AI 멘토들의 3인 3색 투자 분석
                    </span>
                  </div>

                  {Object.entries(mentorAdvice)
                    .filter(
                      ([type]) =>
                        type !== "generated_at" &&
                        type !== "error" &&
                        type !== "NEUTRAL",
                    )
                    .map(([type, advice]: any, index) => {
                      let mentorName = "";
                      let mentorTag = "";
                      let mentorImg = "";

                      if (type === "VALUE") {
                        mentorName = "안정형 투자자";
                        mentorTag = "#기업가치 #재무제표";
                        mentorImg = "/Stable_Fox_icon.png";
                      } else if (type === "MOMENTUM") {
                        mentorName = "공격형 투자자";
                        mentorTag = "#상승추세 #모멘텀";
                        mentorImg = "/Pessimistic_Fox_icon.png";
                      } else if (type === "CONTRARIAN") {
                        mentorName = "역발상 투자자";
                        mentorTag = "#군중심리 #공포매수";
                        mentorImg = "/Aggressive_Fox_icon.png";
                      }

                      const op = advice?.opinion || "HOLD";
                      let opColor = "bg-gray-100 text-gray-500";
                      if (op.includes("BUY"))
                        opColor = "bg-[#FF3B30]/10 text-[#FF3B30]";
                      else if (op.includes("SELL"))
                        opColor = "bg-[#004FFE]/10 text-[#004FFE]";

                      return (
                        <div
                          key={type}
                          className="flex items-start w-full animate-in fade-in slide-in-from-bottom-2"
                          style={{ animationDelay: `${index * 150}ms` }}
                        >
                          <div className="w-12 h-12 rounded-[1rem] bg-transparent flex items-center justify-center shrink-0 z-10 overflow-hidden shadow-sm border border-white/50">
                            <img
                              src={mentorImg}
                              alt={mentorName}
                              className="w-full h-full object-contain bg-white"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                                (
                                  e.target as HTMLImageElement
                                ).parentElement!.innerHTML = "🦉";
                                (
                                  e.target as HTMLImageElement
                                ).parentElement!.className =
                                  "w-12 h-12 rounded-[1rem] bg-white flex items-center justify-center text-xl shrink-0 z-10 shadow-sm border border-blue-50";
                              }}
                            />
                          </div>

                          {/* 닉네임 + 말풍선 영역 */}
                          <div className="flex flex-col ml-3 mt-0.5 max-w-[82%]">
                            <div className="flex items-baseline mb-1.5 ml-1">
                              <span className="text-[13px] font-black text-[#1A334E] tracking-tight mr-1.5">
                                {mentorName}
                              </span>
                              <span className="text-[10px] font-bold text-[#1A334E]/40">
                                {mentorTag}
                              </span>
                            </div>

                            <div className="relative bg-white px-4 py-4 shadow-sm rounded-2xl rounded-tl-sm border border-white/80">
                              <div className="mb-2.5">
                                <span
                                  className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider ${opColor}`}
                                >
                                  {op}
                                </span>
                              </div>

                              <p className="text-[13.5px] font-bold leading-relaxed text-gray-800 break-keep mb-3">
                                {advice?.chat_message ||
                                  advice?.core_logic ||
                                  "분석 내용이 없습니다."}
                              </p>

                              {advice?.feedback_to_user && (
                                <div className="bg-[#F4F6F8] rounded-xl p-3 border border-gray-100">
                                  <p className="text-[12px] font-bold text-[#1A334E]/70 leading-snug">
                                    💡 {"피드백: " + advice.feedback_to_user}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-50">
                  <p className="text-[#1A334E] font-black text-sm">
                    현재 멘토의 조언을 불러올 수 없습니다.
                  </p>
                </div>
              )}
            </div>

            {/* 하단 여백 보호 그라데이션 */}
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#CFE3FA] to-transparent pointer-events-none z-10"></div>
          </div>
        )}
      </div>
      {/* 5. 토론 탭 */}
      {activeTab === "토론" && (
        <div className="flex-1 flex flex-col bg-[#CFE3FA] relative -mx-5 -mb-5 mt-[-10px] h-[calc(100%+2rem)]">
          <div className="flex-1 overflow-y-auto pl-10 py-6 space-y-4 pb-24 hide-scrollbar">
            {Array.isArray(communityPosts) && communityPosts.length > 0 ? (
              communityPosts.map((post: any) => {
                const isMe = post.author === "개미투자자";

                const signal = !isMe
                  ? post.sentiment === "BULL" || post.sentiment === "BUY"
                    ? "BUY"
                    : "SELL"
                  : null;

                return (
                  <div
                    key={post.id}
                    className={`flex flex-col animate-in fade-in ${isMe ? "items-end" : "items-start"}`}
                  >
                    {/* 닉네임 및 빨간/파란 점 영역 */}

                    <div
                      className={`flex items-center mb-1.5 ${isMe ? "mr-1" : "ml-1"}`}
                    >
                      {/* 2. 깔끔한 점 뱃지: 글자 대신 w-2 h-2 사이즈의 둥근 점으로 바꿨습니다! */}

                      {!isMe && signal && (
                        <div
                          className={`w-2 h-2 rounded-full mr-1.5 ${
                            signal === "BUY" ? "bg-[#FF3B30]" : "bg-[#004FFE]"
                          }`}
                        ></div>
                      )}

                      <span
                        className={`text-[11px] font-black ${
                          isMe ? "text-[#004FFE]" : "text-[#1A334E]/80"
                        }`}
                      >
                        {isMe ? `${post.author} (나)` : post.author}
                      </span>
                    </div>

                    {/* 말풍선 본체 */}

                    <div
                      className={`relative px-4 py-3.5 shadow-sm w-fit max-w-[85%] ${
                        isMe
                          ? "bg-[#004FFE] text-white rounded-2xl rounded-tr-sm border border-transparent"
                          : "bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-blue-100/50"
                      }`}
                    >
                      <p
                        className={`text-[13px] font-bold leading-relaxed break-words ${isMe ? "text-white" : "text-gray-800"}`}
                      >
                        {post.content}
                      </p>

                      <div className="mt-1.5 text-right">
                        <span
                          className={`text-[9px] font-bold ${isMe ? "text-white/60" : "text-[#004FFE]/40"}`}
                        >
                          {post.time}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center pb-32 pointer-events-none">
                <div className="bg-white/50 backdrop-blur-sm px-8 py-7 rounded-[2.5rem] text-center border border-white/70 shadow-sm pointer-events-auto">
                  <p className="text-[#1A334E] font-black text-xl mb-1.5">
                    텅~ 비어있네요!
                  </p>
                  <p className="text-[#1A334E] font-bold text-xs opacity-70">
                    이 종목의 첫 번째 토론자가 되어보세요.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 글쓰기 입력창 */}

          <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/80 backdrop-blur-md border-t border-white/50 flex items-center space-x-2 z-10 pb-6">
            <input
              type="text"
              className="flex-1 bg-white border border-blue-50 px-4 py-3 rounded-full text-sm outline-none font-bold text-gray-800 shadow-inner"
              placeholder="의견을 나누어 보세요..."
              value={communityInput}
              onChange={(e) => setCommunityInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handlePostCommunity()}
            />

            <button
              onClick={handlePostCommunity}
              className="bg-[#004FFE] text-white px-5 py-3 rounded-full font-bold text-sm whitespace-nowrap active:scale-95 transition-transform shadow-lg shadow-blue-500/20"
            >
              등록
            </button>
          </div>
        </div>
      )}

      {/* 4. 키패드 주문 모달 */}
      {renderKeypadModal()}
    </div>
  );
};

export default StockDetail;
