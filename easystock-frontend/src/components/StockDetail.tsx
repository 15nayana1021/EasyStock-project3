import React, { useState, useMemo, useEffect, useRef } from "react";
import { ArrowLeft, Star, Share2, ChevronDown, ChevronUp } from "lucide-react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import {
  ChevronLeft,
  Heart,
  Clock,
  X,
  ChevronRight,
  Delete,
  Plus,
} from "lucide-react";
import { StockData, WatchlistItem } from "../types";
import {
  newsListMock,
  agentAdvices,
  AgentAdvice,
  allRankingStocks,
} from "../data/mockData";

import {
  placeOrder,
  fetchMyOrders,
  cancelOrder as apiCancelOrder,
  fetchNewsDetail,
  NewsItem,
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
  stock: StockData;
  isLiked: boolean;
  onToggleWatchlist: () => void;
  onBack: () => void;
  onBuy: (stock: StockData, price: number, qty: number) => void;
  onSell: (stock: StockData, price: number, qty: number) => void;
}

const StockDetail: React.FC<StockDetailProps> = ({
  stock,
  isLiked,
  onToggleWatchlist,
  onBack,
  onBuy,
  onSell,
  virtualDate,
}) => {
  // const { id } = useParams<{ id: string }>();
  // const navigate = useNavigate();
  // const stock = allRankingStocks.find(s => s.id === Number(id));

  // Fallback if stock not found (e.g. invalid ID)
  /* if (!stock && id) {
     // Handle not found
  } */

  // const isLiked = stock ? watchlist.some(item => item.name === stock.name) : false;

  const [activeTab, setActiveTab] = useState("차트");
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [tradeTab, setTradeTab] = useState<"buy" | "sell" | "pending">("buy");
  const [newsDisplayCount, setNewsDisplayCount] = useState(5);
  const [selectedOrderBookPrice, setSelectedOrderBookPrice] = useState<
    number | null
  >(null);
  const orderBookRef = useRef<HTMLDivElement>(null);
  const selectedPriceRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Chart States - Initialize unconditionally
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

  // Trade States
  const [orderAmount, setOrderAmount] = useState("1");
  const [orderPrice, setOrderPrice] = useState("0"); // Initialize with 0, will update after stock load
  const [focusedField, setFocusedField] = useState<"price" | "amount">(
    "amount",
  );

  const { activeNews } = useOutletContext<{ activeNews: NewsItem[] }>();

  // 1. 종목별 키워드 매핑 (줄임말 정의)
  const STOCK_KEYWORDS: Record<string, string[]> = {
    삼송전자: ["삼송전자", "송전자", "삼송"],
    네오볼트전자: ["네오볼트", "네볼"],
    마이크로하드: ["마이크로하드", "마하", "M하드", "Microhard"],
    루미젠바이오: ["루미젠", "루미젠바이오"],
  };

  // 2. 뉴스 필터링 로직 수정
  const stockNews = useMemo(() => {
    if (!stock || !activeNews) return [];

    // 현재 종목에 해당하는 키워드 리스트 가져오기 (없으면 기본 이름 사용)
    const keywords = STOCK_KEYWORDS[stock.name] || [stock.name];

    return activeNews.filter((news) => {
      // 제목, 본문, 요약 중 하나라도 키워드가 포함되어 있는지 검사
      const targetText = `${news.title} ${news.content || ""} ${news.summary || ""}`;

      // 키워드 배열 중 하나라도 텍스트에 들어있으면 true 반환
      return keywords.some((key) => targetText.includes(key));
    });
  }, [activeNews, stock]);

  const [visibleCount, setVisibleCount] = useState(5);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  // Pending Orders State
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);

  useEffect(() => {
    if (stock) {
      const priceNum = parseInt(stock.price.replace(/[^0-9]/g, "")) || 0;
      setOrderPrice(priceNum.toLocaleString());
    }
  }, [stock]);

  const cancelOrder = (id: number) => {
    setPendingOrders((prev) => prev.filter((order) => order.id !== id));
  };

  const tabs = ["차트", "호가", "뉴스", "조언", "토론"];

  // Helper to parse price string to number
  // currentPriceRaw is now used primarily as a fallback during initial load
  const currentPriceRaw = stock
    ? parseInt(stock.price.replace(/[^0-9]/g, "")) || 78500
    : 78500;

  // Calculate Previous Close roughly based on change %
  const changePercentRaw = stock
    ? parseFloat(stock.change.replace(/[^0-9.-]/g, "")) || 0
    : 0;
  const prevClose = Math.round(currentPriceRaw / (1 + changePercentRaw / 100));

  // Determine if stock is up or down based on change string or isUp prop
  const isStockUp = stock ? !stock.change.includes("-") : true;

  useEffect(() => {
    if (activeTab === "호가" && selectedPriceRef.current) {
      selectedPriceRef.current.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  }, [activeTab]);

  // [백엔드 팀]: 실시간 데이터 통합
  // 이 부분은 백엔드에서 차트와 호가 데이터를 가져옵니다.
  // 5초마다 데이터를 새로고침하여 실시간 변동을 반영합니다.
  const [candleData, setCandleData] = useState<OHLCData[]>([]);
  const [orderBookData, setOrderBookData] = useState<OrderBookItem[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(currentPriceRaw);

  useEffect(() => {
    const ticker = stock.symbol || stock.name;

    const loadRealTimeData = async () => {
      // 1. 차트 데이터 로드
      const periodMap: Record<string, string> = {
        "1일": "1d",
        "1주": "1w",
        "1달": "1m",
        "1년": "1y",
      };
      const apiPeriod = periodMap[chartPeriod] || "1d";

      try {
        const { fetchStockChart, fetchOrderBook } =
          await import("../services/api");

        // 차트 조회
        const chartData = await fetchStockChart(ticker, apiPeriod);
        if (chartData && chartData.length > 0) {
          const mapped: OHLCData[] = chartData.map((d) => ({
            open: d.open || d.price || 0,
            high: d.high || d.price || 0,
            low: d.low || d.price || 0,
            close: d.close || d.price || 0,
            dateLabel: formatDateLabel(d.time, chartPeriod),
          }));
          setCandleData(mapped);
        }

        // 2. 호가창 데이터 로드
        const orderBook = await fetchOrderBook(ticker);
        if (orderBook) {
          setCurrentPrice(orderBook.current_price);
          const combined: OrderBookItem[] = [
            ...orderBook.asks.sort((a, b) => b.price - a.price),
            ...orderBook.bids.sort((a, b) => b.price - a.price),
          ];
          setOrderBookData(combined);
        }
      } catch (error) {
        console.error("[StockDetail] Failed to load real-time data", error);
      }
    };

    loadRealTimeData();
    const interval = setInterval(loadRealTimeData, 5000);
    return () => clearInterval(interval);
  }, [chartPeriod, stock]);

  // 날짜 포맷팅 도우미 함수
  const formatDateLabel = (isoTime: string, period: string) => {
    const date = new Date(isoTime);
    if (period === "1일") {
      return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    } else if (period === "1년") {
      return `${date.getFullYear().toString().slice(2)}.${(date.getMonth() + 1).toString().padStart(2, "0")}`;
    } else {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  };

  // Scroll to end of chart on update
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft =
        scrollContainerRef.current.scrollWidth;
    }
  }, [candleData]);

  // 2. 아이디 가져오기 및 미체결 로드
  const userId = localStorage.getItem("stocky_user_id") || "1";

  useEffect(() => {
    const loadPendingOrders = async () => {
      if (tradeTab === "pending" && userId) {
        try {
          const orders = await fetchMyOrders(userId);

          const myPending = orders.filter(
            (o: any) =>
              o.status === "PENDING" ||
              o.status === "placed" ||
              o.status === "WAITING",
          );

          const mappedOrders: PendingOrder[] = myPending.map((o: any) => {
            const rawSide = o.order_type || o.side || o.type || "정보없음";

            const upperSide = String(rawSide).toUpperCase().trim();
            const isBuy =
              upperSide.includes("BUY") ||
              upperSide.includes("BID") ||
              upperSide.includes("매수");

            return {
              id: o.order_id || o.id,
              type: isBuy ? "buy" : "sell",
              name: o.ticker || o.company_name || stock.name,
              qty: String(o.quantity),
              price: String(o.price),
            };
          });
          setPendingOrders(mappedOrders);
        } catch (error) {
          console.error("미체결 내역 로딩 실패:", error);
        }
      }
    };

    loadPendingOrders();
  }, [tradeTab, userId, stock?.name]);

  // 3. 키패드 입력 로직
  const handleKeypadPress = (key: string) => {
    const isAmount = focusedField === "amount";
    const currentVal = isAmount ? orderAmount : orderPrice.replace(/,/g, "");
    let newVal = currentVal;

    if (key === "back") {
      newVal = currentVal.slice(0, -1) || "0";
    } else if (key === "00") {
      newVal = currentVal === "0" ? "0" : currentVal + "00";
    } else {
      newVal = currentVal === "0" ? key : currentVal + key;
    }

    if (isAmount) {
      setOrderAmount(newVal);
    } else {
      const num = parseInt(newVal) || 0;
      setOrderPrice(num.toLocaleString());
    }
  };

  // 4. 주문 취소 함수
  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm("정말 주문을 취소하시겠습니까?")) return;

    const result = await apiCancelOrder(orderId);
    if (result.status === "success" || result.success) {
      alert("주문이 취소되었습니다.");
      setPendingOrders((prev) => prev.filter((order) => order.id !== orderId));
    } else {
      alert("취소 실패: " + (result.detail || "오류가 발생했습니다."));
    }
  };

  // 5. 주문 실행 함수
  const executeOrder = async () => {
    console.log("주문 시도! 전송할 날짜:", virtualDate);
    if (!stock || !userId) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (isOrdering) return;

    const price = parseInt(orderPrice.replace(/,/g, ""));
    const qty = parseInt(orderAmount);

    if (price <= 0 || qty <= 0) {
      alert("가격과 수량을 올바르게 입력해주세요.");
      return;
    }

    setIsOrdering(true);
    try {
      const side = tradeTab === "buy" ? "BUY" : "SELL";
      const result = await placeOrder(
        stock.symbol || stock.name,
        side,
        price,
        qty,
        userId,
        virtualDate,
      );

      if (result.success || result.order_id) {
        setIsTradeModalOpen(false);
        setOrderAmount("1");

        if (side === "BUY" && onBuy) (onBuy as any)(stock, price, qty);
        if (side === "SELL" && onSell) (onSell as any)(stock, price, qty);

        // 미체결인 경우에만 사용자 안심용으로 얼럿 하나 띄워줍니다.
        if (result.status !== "FILLED") {
          alert("주문이 접수되었습니다. (미체결)");
        }
      } else {
        alert("주문 실패: " + (result.msg || "잔액이나 수량을 확인하세요."));
      }
    } catch (error) {
      console.error(error);
      alert("서버와 통신할 수 없습니다.");
    } finally {
      setIsOrdering(false);
    }
  };

  const renderOrderBook = () => {
    return (
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-32 bg-white flex flex-col relative animate-in fade-in duration-300">
        <div ref={orderBookRef} className="flex flex-col flex-1 pb-4">
          {orderBookData.map((item) => {
            const isSelected = selectedOrderBookPrice === item.price;
            const isAsk = item.type === "ask";
            const priceColor =
              item.price > prevClose
                ? "text-red-500"
                : item.price < prevClose
                  ? "text-blue-500"
                  : "text-gray-800";
            const isCurrentPrice = item.price === currentPrice;

            return (
              <div
                key={item.price}
                ref={isCurrentPrice ? selectedPriceRef : null}
                onClick={() =>
                  setSelectedOrderBookPrice(isSelected ? null : item.price)
                }
                className={`h-12 flex items-center relative cursor-pointer border-b border-gray-50/50 transition-colors ${
                  isAsk ? "bg-blue-50/20" : "bg-red-50/20"
                } ${isSelected ? "bg-gray-100" : ""}`}
              >
                <div className="w-[34%] h-full relative">
                  {/* ... (Existing OrderBook logic preserved) ... */}
                  {isSelected ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTradeTab("buy");
                        setOrderPrice(item.price.toLocaleString());
                        setIsTradeModalOpen(true);
                      }}
                      className="absolute inset-0 w-full h-full bg-red-500 text-white font-black text-sm flex items-center justify-center hover:bg-red-600 transition-colors z-20 shadow-inner animate-in fade-in duration-200"
                    >
                      <div className="flex flex-col items-center leading-none">
                        <span className="text-[10px] opacity-80 mb-0.5">
                          지정가
                        </span>
                        <span>매수</span>
                      </div>
                    </button>
                  ) : (
                    isAsk && (
                      <div className="w-full h-full flex items-center justify-end pr-2">
                        <div className="relative w-full h-6 bg-blue-100/50 rounded-r-md overflow-hidden">
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 font-bold text-xs">
                            {item.volume.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div
                  className={`flex-1 h-full flex items-center justify-center font-bold text-sm z-10 ${isSelected ? "bg-white border-x border-gray-100" : ""} ${priceColor}`}
                >
                  {item.price.toLocaleString()}
                </div>

                <div className="w-[34%] h-full relative">
                  {isSelected ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTradeTab("sell");
                        setOrderPrice(item.price.toLocaleString());
                        setIsTradeModalOpen(true);
                      }}
                      className="absolute inset-0 w-full h-full bg-blue-500 text-white font-black text-sm flex items-center justify-center hover:bg-blue-600 transition-colors z-20 shadow-inner animate-in fade-in duration-200"
                    >
                      <div className="flex flex-col items-center leading-none">
                        <span className="text-[10px] opacity-80 mb-0.5">
                          지정가
                        </span>
                        <span>매도</span>
                      </div>
                    </button>
                  ) : (
                    !isAsk && (
                      <div className="w-full h-full flex items-center justify-start pl-2">
                        <div className="relative w-full h-6 bg-red-100/50 rounded-l-md overflow-hidden">
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 text-red-500 font-bold text-xs">
                            {item.volume.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderChart = () => {
    const prices = candleData.flatMap((d) => [d.high, d.low]);
    const minVal = Math.min(...prices) * 0.95;
    const maxVal = Math.max(...prices) * 1.05;
    const range = maxVal - minVal;

    // Responsive Dimensions
    const viewportHeight = window.innerHeight;
    const reservedSpace = 450; // Header + Price + Tabs + Buttons + Padding
    const maxHeight = 350;
    const minHeight = 200; // Minimum to keep components visible
    const containerHeight = Math.max(
      minHeight,
      Math.min(maxHeight, viewportHeight - reservedSpace),
    );
    const padding = { top: 30, bottom: 35, left: 0, right: 50 }; // Reduced padding
    const chartHeight = containerHeight - padding.bottom - padding.top;

    // Dynamic Width: Ensure scroll if candles are many
    const candleWidth = 15; // Width per candle
    const minChartWidth = window.innerWidth; // At least full screen width
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

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left; // Mouse X relative to SVG (handling scroll)

      if (x > chartWidth) {
        setHoverData(null);
        return;
      }

      // Find closest candle index
      const index = Math.floor((x / chartWidth) * candleData.length);

      if (index >= 0 && index < candleData.length) {
        const d = candleData[index];
        const diff = d.close - d.open;
        const diffPercent = (diff / d.open) * 100;

        // Exact X center of the candle
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
      <div className="bg-white rounded-[2.5rem] pt-6 pb-4 shadow-sm border border-white shrink-0 flex flex-col relative overflow-hidden animate-in fade-in duration-500 mb-2">
        {/* Top Legend (Fixed absolute top left) */}
        <div className="absolute left-6 top-6 flex items-center space-x-3 z-10 bg-white/50 backdrop-blur-sm px-2 py-1 rounded-full">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-[10px] font-bold text-gray-500">상승</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-[10px] font-bold text-gray-500">하락</span>
          </div>
        </div>

        {/* Y-Axis Labels (Fixed Right Overlay) - Reduced spacing to ~1cm */}
        <div
          className="absolute right-0 flex flex-col text-[10px] font-bold text-gray-400 pointer-events-none text-right pr-3 z-20"
          style={{
            top: "30px",
            height: "5cm",
            justifyContent: "space-between",
          }}
        >
          <span>{Math.round(maxVal).toLocaleString()}</span>
          <span>{Math.round(minVal + range * 0.75).toLocaleString()}</span>
          <span>{Math.round(minVal + range * 0.5).toLocaleString()}</span>
          <span>{Math.round(minVal + range * 0.25).toLocaleString()}</span>
          <span>{Math.round(minVal).toLocaleString()}</span>
        </div>

        {/* Scrollable Chart Container */}
        <div
          className="flex-1 overflow-x-auto hide-scrollbar relative w-full"
          ref={scrollContainerRef}
        >
          {/* SVG Chart */}
          <svg
            width={calculatedWidth}
            height={containerHeight}
            className="overflow-visible"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverData(null)}
            style={{ cursor: "crosshair" }}
          >
            {/* Grid Lines */}
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

            {/* X-Axis Labels */}
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

            {/* Candles */}
            {candleData.map((d, i) => {
              const isUp = d.close >= d.open;
              const color = isUp ? "#ef4444" : "#3b82f6";
              const barW = chartWidth / candleData.length;
              const wickX = i * barW + barW / 2;
              const bodyX = i * barW + 2;
              const bodyWidth = Math.max(barW - 4, 2);

              const yOpen = getY(d.open);
              const yClose = getY(d.close);
              const yHigh = getY(d.high);
              const yLow = getY(d.low);

              return (
                <g key={i}>
                  <line
                    x1={wickX}
                    y1={yHigh}
                    x2={wickX}
                    y2={yLow}
                    stroke={isUp ? "#fca5a5" : "#93c5fd"}
                    strokeWidth="1"
                  />
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

            {/* Crosshair & Interactive Elements */}
            {hoverData && (
              <g>
                {/* Vertical Line */}
                <line
                  x1={hoverData.x}
                  y1={padding.top}
                  x2={hoverData.x}
                  y2={containerHeight - padding.bottom}
                  stroke="#2D8C69"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.8"
                />
                {/* Horizontal Line */}
                <line
                  x1={0}
                  y1={hoverData.y}
                  x2={calculatedWidth}
                  y2={hoverData.y}
                  stroke="#2D8C69"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.8"
                />

                {/* Price Tag (Left Floating) */}
                <g
                  transform={`translate(${hoverData.x + 10}, ${hoverData.y - 12})`}
                >
                  <rect
                    x="0"
                    y="0"
                    width="60"
                    height="28"
                    rx="6"
                    fill="#2D8C69"
                    filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.1))"
                  />
                  <text
                    x="30"
                    y="14"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill="white"
                    dy="0.3em"
                  >
                    {Math.round(hoverData.price).toLocaleString()}
                  </text>
                </g>

                {/* Date Tag (Bottom Floating) */}
                <g
                  transform={`translate(${hoverData.x}, ${containerHeight - padding.bottom + 5})`}
                >
                  <rect
                    x="-20"
                    y="0"
                    width="40"
                    height="20"
                    rx="4"
                    fill="#374151"
                  />
                  <text
                    x="0"
                    y="14"
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

        {/* Footer (Inside Card) */}
        <div className="px-6 pb-2 flex items-end justify-between shrink-0">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-gray-400">최고</span>
              <span className="text-[11px] font-black text-gray-800">
                {Math.round(maxVal).toLocaleString()}원
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-gray-400">최저</span>
              <span className="text-[11px] font-black text-gray-800">
                {Math.round(minVal).toLocaleString()}원
              </span>
            </div>
          </div>

          <div className="flex bg-gray-100/80 p-0.5 rounded-xl space-x-0.5">
            {["1일", "1주", "1달", "1년"].map((period) => (
              <button
                key={period}
                onClick={() => setChartPeriod(period as any)}
                className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all ${
                  chartPeriod === period
                    ? "bg-white text-[#2D8C69] shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 2. 뉴스 화면 그리기
  const handleNewsClick = async (id: number) => {
    try {
      const detail = await fetchNewsDetail(id);
      setSelectedNews(detail);
    } catch (error) {
      // 실패하면 목록에 있는 정보라도 보여줌
      const fallback = stockNews.find((n) => n.id === id);
      if (fallback) setSelectedNews(fallback);
    }
  };

  const handleShowMore = () => setVisibleCount((prev) => prev + 5);
  const handleBack = () => setSelectedNews(null);
  const handleShowLess = () => setVisibleCount(5);

  // 보여줄 뉴스 개수 자르기
  const visibleNews = stockNews.slice(0, visibleCount);
  const hasMore = stockNews.length > visibleCount;

  // 뉴스 렌더링
  const renderNews = () => {
    // A. 상세 보기 모드 (뉴스를 클릭했을 때)
    if (selectedNews) {
      return (
        <div className="flex flex-col h-full animate-in fade-in duration-200">
          <button
            onClick={handleBack}
            className="mb-4 flex items-center text-gray-500 hover:text-gray-800 transition-colors text-sm font-bold"
          >
            ← 목록으로
          </button>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                {selectedNews.category || "뉴스"}
              </span>
              <span className="text-[10px] text-gray-400">
                {selectedNews.display_date || selectedNews.time}
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 leading-tight mb-4">
              {selectedNews.title}
            </h2>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {selectedNews.content ||
                selectedNews.summary ||
                "내용이 없습니다."}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 text-right text-xs text-gray-400">
              Source: {selectedNews.source || "Stocky News"}
            </div>
          </div>
        </div>
      );
    }

    // B. 목록 보기 모드 (평소 화면)
    return (
      <div className="space-y-3 pb-20">
        {visibleNews.length > 0 ? (
          visibleNews.map((news, index) => (
            <div
              key={`${news.id}-${index}`}
              onClick={() => handleNewsClick(news.id)}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-green-200 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-gray-400">
                  • {news.category || "뉴스"}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-gray-800 leading-snug mb-1">
                {news.title}
              </h3>
              <p className="text-[12px] text-gray-500 font-medium opacity-80 line-clamp-2">
                {news.summary}
              </p>
              <div className="mt-3 flex justify-end items-center text-[10px] text-gray-400 gap-2">
                <span className="font-medium text-gray-500">
                  — {news.source || "Stocky News"}
                </span>
                <span>{news.display_date || news.time}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-400 text-xs font-bold">
            아직 등록된 뉴스가 없습니다.
          </div>
        )}

        {/* 더보기 / 접기 버튼 */}
        <div className="flex gap-2 mt-4">
          {hasMore && (
            <button
              onClick={handleShowMore}
              className="flex-1 py-4 bg-white/50 hover:bg-white rounded-2xl flex items-center justify-center space-x-2 text-gray-500 font-bold text-xs transition-all active:scale-[0.98] border border-white shadow-sm"
            >
              <ChevronDown size={14} />
              <span>더보기 ({stockNews.length - visibleCount}개 남음)</span>
            </button>
          )}

          {visibleCount > 5 && (
            <button
              onClick={handleShowLess}
              className="flex-1 py-4 bg-white/50 hover:bg-white rounded-2xl flex items-center justify-center space-x-2 text-gray-500 font-bold text-xs transition-all active:scale-[0.98] border border-white shadow-sm"
            >
              <ChevronUp size={14} />
              <span>접기</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderAdvice = () => (
    <div className="flex-1 flex flex-col space-y-4 overflow-y-auto hide-scrollbar animate-in fade-in duration-500 pb-8">
      {agentAdvices.map((agent) => (
        <div
          key={agent.id}
          className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center space-x-3 mb-2">
            <img
              src={agent.avatar}
              className="w-10 h-10 rounded-full bg-gray-50"
              alt="avatar"
            />
            <div>
              <h3 className="text-sm font-black text-gray-800">{agent.type}</h3>
              <div className="flex gap-1">
                {agent.tags.map((t, i) => (
                  <span
                    key={i}
                    className={`text-[9px] px-1.5 rounded ${agent.tagBg} ${agent.tagColor}`}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {agent.text}
          </p>
        </div>
      ))}
    </div>
  );

  const renderTradeModal = () => {
    if (!isTradeModalOpen) return null;
    const keypad = [
      ["1", "2", "3"],
      ["4", "5", "6"],
      ["7", "8", "9"],
      ["00", "0", "back"],
    ];

    return (
      <div className="absolute inset-0 z-[100] flex flex-col bg-white animate-in slide-in-from-bottom duration-300">
        {/* Header with 3 Tabs */}
        <div className="px-6 pt-8 pb-0 flex items-center justify-between border-b border-gray-100">
          <div className="flex space-x-8">
            {[
              { key: "buy", label: "매수" },
              { key: "sell", label: "매도" },
              { key: "pending", label: "미체결" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTradeTab(tab.key as any)}
                className={`pb-3 text-base font-black transition-colors ${
                  tradeTab === tab.key
                    ? "text-[#2D8C69] border-b-2 border-[#2D8C69]"
                    : "text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button onClick={() => setIsTradeModalOpen(false)}>
            <X className="text-gray-400" size={24} />
          </button>
        </div>

        {/* Content Area */}
        {tradeTab === "pending" ? (
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {pendingOrders.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 font-bold">
                미체결 주문이 없습니다
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm"
                  >
                    <div className="flex-1">
                      <div
                        className={`text-sm font-black mb-1 ${order.type === "buy" ? "text-red-500" : "text-blue-500"}`}
                      >
                        {order.type === "buy" ? "매수" : "매도"}
                      </div>
                      <div className="text-xs text-gray-500 font-bold">
                        {order.qty}주 · {parseInt(order.price).toLocaleString()}
                        원
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {order.name}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-200"
                    >
                      취소
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Buy/Sell Tab
          <div className="flex-1 flex flex-col p-6 bg-gray-50">
            {/* Price Display Box */}
            <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 font-bold">
                  주문 가격
                </span>
                <button
                  onClick={() => {
                    if (stock) {
                      const priceNum =
                        parseInt(stock.price.replace(/[^0-9]/g, "")) || 0;
                      setOrderPrice(priceNum.toLocaleString());
                    }
                  }}
                  className="text-xs text-gray-500 font-bold hover:text-gray-700"
                >
                  현재 가격으로
                </button>
              </div>
              <div
                onClick={() => setFocusedField("price")}
                className={`text-2xl font-black cursor-pointer transition-colors ${
                  focusedField === "price" ? "text-[#2D8C69]" : "text-gray-800"
                }`}
              >
                {orderPrice}원
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 font-bold">
                  일반 | 소수점
                </span>
                <span
                  onClick={() => setFocusedField("amount")}
                  className={`text-lg font-black cursor-pointer transition-colors ${
                    focusedField === "amount"
                      ? "text-[#2D8C69]"
                      : "text-gray-800"
                  }`}
                >
                  {orderAmount}주
                </span>
              </div>
              <button className="text-xs text-[#2D8C69] font-bold flex items-center">
                매수가능 1,000,000원 <ChevronRight size={14} />
              </button>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {keypad.flat().map((k, i) => (
                <button
                  key={i}
                  onClick={() => handleKeypadPress(k)}
                  className="h-14 text-xl font-black text-gray-800 bg-white rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  {k === "back" ? <Delete size={20} /> : k}
                </button>
              ))}
            </div>

            {/* Bottom Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-auto">
              <button
                onClick={() => setIsTradeModalOpen(false)}
                disabled={isOrdering}
                className="py-4 bg-gray-400 text-white rounded-xl font-black text-base disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={executeOrder}
                disabled={isOrdering}
                className={`py-4 text-white rounded-xl font-black text-base flex items-center justify-center ${
                  tradeTab === "buy"
                    ? "bg-red-500 hover:bg-red-600 disabled:bg-red-300"
                    : "bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300"
                }`}
              >
                {/* 주문 중이면 '처리중...' 표시 */}
                {isOrdering ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    처리중
                  </span>
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

  // if (!stock) return <div className="flex items-center justify-center h-full">로딩중...</div>;

  return (
    // Replaced fixed overlay with flex column, letting Layout handle the frame
    <div className="flex flex-col h-full bg-[#F4F8F6] animate-in slide-in-from-right duration-300 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between shrink-0 bg-[#F4F8F6]">
        <button
          onClick={onBack}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm hover:text-gray-600 active:scale-95 transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-black text-gray-800">{stock.name}</h2>
          <span className="text-xs font-bold text-gray-400">{stock.price}</span>
        </div>
        <button
          onClick={onToggleWatchlist}
          className={`w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all ${isLiked ? "text-red-500" : "text-gray-300"}`}
        >
          <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Price Hero Section */}
      <div className="flex flex-col items-center py-4 shrink-0">
        <h1 className="text-4xl font-black text-gray-800 tracking-tighter mb-1">
          {stock.price}
        </h1>
        <div
          className={`flex items-center space-x-1 font-black ${isStockUp ? "text-red-500" : "text-blue-500"}`}
        >
          <span className="text-sm">{stock.change}</span>
          <span className="text-xs bg-opacity-10 px-1.5 py-0.5 rounded-md bg-current">
            {isStockUp ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 mb-4 shrink-0">
        <div className="bg-white p-1 rounded-2xl flex shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${activeTab === tab ? "bg-[#2D8C69] text-white shadow-md" : "text-gray-400 hover:text-gray-600"}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 px-6 overflow-y-auto hide-scrollbar flex flex-col pb-6">
        {activeTab === "차트" && (
          <>
            {renderChart()}
            {/* Buy/Sell Buttons below Chart */}
            <div className="mt-4 flex items-center space-x-4 shrink-0">
              <button
                onClick={() => {
                  setTradeTab("sell");
                  setIsTradeModalOpen(true);
                }}
                className="flex-1 bg-white border border-[#2D8C69]/20 rounded-[1.5rem] py-4 font-black text-[#2D8C69] shadow-sm active:scale-95 transition-all text-lg"
              >
                팔게요
              </button>
              <button
                onClick={() => {
                  setTradeTab("buy");
                  setIsTradeModalOpen(true);
                }}
                className="flex-1 bg-[#2D8C69] hover:bg-[#257a5b] text-white rounded-[1.5rem] py-4 font-black text-lg shadow-lg shadow-[#2D8C69]/20 active:scale-95 transition-all"
              >
                살게요
              </button>
            </div>
          </>
        )}
        {activeTab === "호가" && renderOrderBook()}
        {activeTab === "뉴스" && renderNews()}
        {activeTab === "조언" && renderAdvice()}
        {activeTab === "토론" && (
          <div className="flex items-center justify-center h-40 text-gray-400 font-bold">
            토론 기능 준비중
          </div>
        )}
      </div>

      {renderTradeModal()}
    </div>
  );
};

export default StockDetail;
