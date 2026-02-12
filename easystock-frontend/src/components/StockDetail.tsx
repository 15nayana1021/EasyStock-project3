
import React, { useState, useMemo, useEffect, useRef } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Heart, Clock, X, ChevronRight, Delete, Plus } from 'lucide-react';
import { StockData, WatchlistItem } from '../types';
import { newsListMock, agentAdvices, NewsItem, AgentAdvice, allRankingStocks } from '../data/mockData';

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
  type: 'ask' | 'bid';
}

interface PendingOrder {
  id: number;
  type: 'buy' | 'sell';
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

const StockDetail: React.FC<StockDetailProps> = ({ stock, isLiked, onToggleWatchlist, onBack, onBuy, onSell }) => {
  // const { id } = useParams<{ id: string }>();
  // const navigate = useNavigate();
  // const stock = allRankingStocks.find(s => s.id === Number(id));

  // Fallback if stock not found (e.g. invalid ID)
  /* if (!stock && id) {
     // Handle not found
  } */

  // const isLiked = stock ? watchlist.some(item => item.name === stock.name) : false;

  const [activeTab, setActiveTab] = useState('차트');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeTab, setTradeTab] = useState<'buy' | 'sell' | 'pending'>('buy');
  const [newsDisplayCount, setNewsDisplayCount] = useState(5);
  const [selectedOrderBookPrice, setSelectedOrderBookPrice] = useState<number | null>(null);
  const orderBookRef = useRef<HTMLDivElement>(null);
  const selectedPriceRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Chart States - Initialize unconditionally
  const [chartPeriod, setChartPeriod] = useState<'1일' | '1주' | '1달' | '1년'>('1일');
  const [hoverData, setHoverData] = useState<{ price: number; change: number; changePercent: number; y: number; x: number; date: string } | null>(null);
  
  // Trade States
  const [orderAmount, setOrderAmount] = useState("1");
  const [orderPrice, setOrderPrice] = useState("0"); // Initialize with 0, will update after stock load
  const [focusedField, setFocusedField] = useState<'price' | 'amount'>('amount');

  // Pending Orders State
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);

  useEffect(() => {
    if (stock) {
      const priceNum = parseInt(stock.price.replace(/[^0-9]/g, '')) || 0;
      setOrderPrice(priceNum.toLocaleString());
    }
  }, [stock]);

  const cancelOrder = (id: number) => {
    setPendingOrders(prev => prev.filter(order => order.id !== id));
  };
  
  const tabs = ['차트', '호가', '뉴스', '조언', '토론'];

  // Helper to parse price string to number
  const currentPriceRaw = stock ? (parseInt(stock.price.replace(/[^0-9]/g, '')) || 78500) : 78500;
  
  // Calculate Previous Close roughly based on change %
  const changePercentRaw = stock ? (parseFloat(stock.change.replace(/[^0-9.-]/g, '')) || 0) : 0;
  const prevClose = Math.round(currentPriceRaw / (1 + changePercentRaw / 100));

  // Determine if stock is up or down based on change string or isUp prop
  const isStockUp = stock ? !stock.change.includes('-') : true;

  // Generate Order Book Data
  const orderBookData = useMemo(() => {
    const data: OrderBookItem[] = [];
    const tick = currentPriceRaw > 100000 ? 500 : 100;

    for (let i = 10; i > 0; i--) {
        const price = currentPriceRaw + i * tick;
        data.push({ price, volume: Math.floor(Math.random() * 2000) + 500, type: 'ask' });
    }

    for (let i = 0; i < 11; i++) {
        const price = currentPriceRaw - i * tick;
        data.push({ price, volume: Math.floor(Math.random() * 3000) + 800, type: 'bid' });
    }
    
    return data;
  }, [currentPriceRaw]);

  useEffect(() => {
    if (activeTab === '호가' && selectedPriceRef.current) {
      selectedPriceRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [activeTab]);


  // [백엔드 팀]: 차트 데이터 통합
  // 이 부분은 백엔드에서 차트 데이터를 가져옵니다 (Heo 명세서: GET /stocks/{ticker}/chart).
  // 현재 로직은 백엔드가 단순 시계열 가격 데이터만 제공하기 때문에 단일 가격 포인트를 OHLC 데이터(시가=고가=저가=종가=가격)로 매핑합니다.
  // 백엔드가 완전한 OHLC 데이터를 지원하게 되면, 아래 매핑 로직을 업데이트해주세요.
  const [candleData, setCandleData] = useState<OHLCData[]>([]);

  useEffect(() => {
    const loadChartData = async () => {
      // 기간(period)을 API 형식으로 매핑
      const periodMap: Record<string, string> = {
        '1일': '1d',
        '1주': '1w',
        '1달': '1m',
        '1년': '1y'
      };
      const apiPeriod = periodMap[chartPeriod] || '1d';
      
      // 티커(심볼)가 있으면 사용하고, 없으면 이름 사용 (폴백)
      const ticker = stock.symbol || stock.name;

      try {
        const data = await import('../services/api').then(mod => mod.fetchStockChart(ticker, apiPeriod));
        
        if (data && data.length > 0) {
          const mapped: OHLCData[] = data.map((d) => {
             // 단일 가격에서 OHLC 모의 데이터 생성
             return {
               open: d.price,
               high: d.price,
               low: d.price,
               close: d.price,
               // 기간에 따른 날짜 라벨 포맷팅
               dateLabel: formatDateLabel(d.time, chartPeriod)
             };
          });
          setCandleData(mapped);
        } else {
           // 비어있을 경우 더미 데이터로 폴백 (백엔드가 비어있어도 데모 연속성을 위해)
           console.warn("[StockDetail] Backend returned empty chart data. Using dummy data.");
           setCandleData(generateDummyCandleData(currentPriceRaw, chartPeriod));
        }
      } catch (error) {
         console.error("[StockDetail] Failed to load chart data", error);
         setCandleData(generateDummyCandleData(currentPriceRaw, chartPeriod));
      }
    };

    loadChartData();
  }, [chartPeriod, stock, currentPriceRaw]); // currentPriceRaw used for dummy generation

  // 날짜 포맷팅 도우미 함수
  const formatDateLabel = (isoTime: string, period: string) => {
    const date = new Date(isoTime);
    if (period === '1일') {
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (period === '1년') {
      return `${date.getFullYear().toString().slice(2)}.${(date.getMonth()+1).toString().padStart(2, '0')}`;
    } else {
      return `${date.getMonth()+1}/${date.getDate()}`;
    }
  };

  // 더미 데이터 생성 도우미 (폴백용) - useMemo 외부 함수로 이동
  const generateDummyCandleData = (basePrice: number, period: string): OHLCData[] => {
      let count, volatility;
      if (period === '1일') { count = 48; volatility = 0.01; }
      else if (period === '1주') { count = 7; volatility = 0.03; }
      else if (period === '1달') { count = 30; volatility = 0.05; }
      else { count = 12; volatility = 0.08; }
      
      let current = basePrice * 0.95; 
      const data: OHLCData[] = [];
  
      // 기준 날짜: 2026-02-03 (참조)
      let currentDate = new Date('2026-02-03T15:30:00'); 
  
      let startDate = new Date(currentDate);
      if (period === '1일') startDate.setHours(currentDate.getHours() - 24);
      else if (period === '1주') startDate.setDate(currentDate.getDate() - 7);
      else if (period === '1달') startDate.setDate(currentDate.getDate() - 30);
      else startDate.setMonth(currentDate.getMonth() - 12);
  
      for (let i = 0; i < count; i++) {
        const change = (Math.random() - 0.45) * basePrice * volatility;
        const open = current;
        const close = current + change;
        const high = Math.max(open, close) + Math.random() * basePrice * 0.005;
        const low = Math.min(open, close) - Math.random() * basePrice * 0.005;
        
        let label = '';
        let displayDate = new Date(startDate);
        if (period === '1일') {
           displayDate.setMinutes(startDate.getMinutes() + (i * 30));
           label = `${displayDate.getHours().toString().padStart(2, '0')}:${displayDate.getMinutes().toString().padStart(2, '0')}`;
        } else if (period === '1주' || period === '1달') {
           displayDate.setDate(startDate.getDate() + i);
           label = `${displayDate.getMonth()+1}/${displayDate.getDate()}`;
        } else {
           displayDate.setMonth(startDate.getMonth() + i);
           label = `${displayDate.getFullYear().toString().slice(2)}.${(displayDate.getMonth()+1).toString().padStart(2, '0')}`;
        }
  
        data.push({ open, high, low, close, dateLabel: label });
        current = close;
      }
      data[data.length - 1].close = basePrice;
      return data;
  };

  // Scroll to end of chart on update
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [candleData]);



  const handleKeypadPress = (key: string) => {
    const isAmount = focusedField === 'amount';
    const currentVal = isAmount ? orderAmount : orderPrice.replace(/,/g, '');
    let newVal = currentVal;

    if (key === 'back') {
      newVal = currentVal.slice(0, -1) || '0';
    } else if (key === '00') {
      newVal = currentVal === '0' ? '0' : currentVal + '00';
    } else {
      newVal = currentVal === '0' ? key : currentVal + key;
    }

    if (isAmount) {
      setOrderAmount(newVal);
    } else {
      const num = parseInt(newVal) || 0;
      setOrderPrice(num.toLocaleString());
    }
  };

  const executeOrder = () => {
    if (!stock) return;

    const price = parseInt(orderPrice.replace(/,/g, ''));
    const qty = parseInt(orderAmount);
    const currentPrice = parseInt(stock.price.replace(/[^0-9]/g, ''));

    // If price doesn't match current price, add to pending orders
    if (price !== currentPrice) {
      const newOrder: PendingOrder = {
        id: Date.now(),
        type: tradeTab === 'buy' ? 'buy' : 'sell',
        name: stock.name,
        qty: orderAmount,
        price: orderPrice
      };
      setPendingOrders(prev => [...prev, newOrder]);
      setIsTradeModalOpen(false);
      return;
    }

    // Execute immediately if price matches
    if (tradeTab === 'buy' && onBuy) {
      onBuy(stock, price, qty);
    } else if (tradeTab === 'sell' && onSell) {
      onSell(stock, price, qty);
    }
    
    setIsTradeModalOpen(false);
  };

  const renderOrderBook = () => {
    return (
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-32 bg-white flex flex-col relative animate-in fade-in duration-300">
        <div ref={orderBookRef} className="flex flex-col flex-1 pb-4">
          {orderBookData.map((item) => {
            const isSelected = selectedOrderBookPrice === item.price;
            const isAsk = item.type === 'ask';
            const priceColor = item.price > prevClose ? 'text-red-500' : item.price < prevClose ? 'text-blue-500' : 'text-gray-800';
            const isCurrentPrice = item.price === currentPriceRaw;

            return (
              <div 
                key={item.price}
                ref={isCurrentPrice ? selectedPriceRef : null}
                onClick={() => setSelectedOrderBookPrice(isSelected ? null : item.price)}
                className={`h-12 flex items-center relative cursor-pointer border-b border-gray-50/50 transition-colors ${
                  isAsk ? 'bg-blue-50/20' : 'bg-red-50/20'
                } ${isSelected ? 'bg-gray-100' : ''}`}
              >
                <div className="w-[34%] h-full relative">
                  {/* ... (Existing OrderBook logic preserved) ... */}
                  {isSelected ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setTradeTab('buy'); setOrderPrice(item.price.toLocaleString()); setIsTradeModalOpen(true); }}
                      className="absolute inset-0 w-full h-full bg-red-500 text-white font-black text-sm flex items-center justify-center hover:bg-red-600 transition-colors z-20 shadow-inner animate-in fade-in duration-200"
                    >
                      <div className="flex flex-col items-center leading-none">
                        <span className="text-[10px] opacity-80 mb-0.5">지정가</span>
                        <span>매수</span>
                      </div>
                    </button>
                  ) : (
                    isAsk && (
                      <div className="w-full h-full flex items-center justify-end pr-2">
                        <div className="relative w-full h-6 bg-blue-100/50 rounded-r-md overflow-hidden">
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 font-bold text-xs">{item.volume.toLocaleString()}</div>
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div className={`flex-1 h-full flex items-center justify-center font-bold text-sm z-10 ${isSelected ? 'bg-white border-x border-gray-100' : ''} ${priceColor}`}>
                  {item.price.toLocaleString()}
                </div>

                <div className="w-[34%] h-full relative">
                  {isSelected ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setTradeTab('sell'); setOrderPrice(item.price.toLocaleString()); setIsTradeModalOpen(true); }}
                      className="absolute inset-0 w-full h-full bg-blue-500 text-white font-black text-sm flex items-center justify-center hover:bg-blue-600 transition-colors z-20 shadow-inner animate-in fade-in duration-200"
                    >
                      <div className="flex flex-col items-center leading-none">
                        <span className="text-[10px] opacity-80 mb-0.5">지정가</span>
                        <span>매도</span>
                      </div>
                    </button>
                  ) : (
                     !isAsk && (
                      <div className="w-full h-full flex items-center justify-start pl-2">
                        <div className="relative w-full h-6 bg-red-100/50 rounded-l-md overflow-hidden">
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 text-red-500 font-bold text-xs">{item.volume.toLocaleString()}</div>
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
    const prices = candleData.flatMap(d => [d.high, d.low]);
    const minVal = Math.min(...prices) * 0.95; 
    const maxVal = Math.max(...prices) * 1.05;
    const range = maxVal - minVal;

    // Responsive Dimensions
    const viewportHeight = window.innerHeight;
    const reservedSpace = 450; // Header + Price + Tabs + Buttons + Padding
    const maxHeight = 350;
    const minHeight = 200; // Minimum to keep components visible
    const containerHeight = Math.max(minHeight, Math.min(maxHeight, viewportHeight - reservedSpace));
    const padding = { top: 30, bottom: 35, left: 0, right: 50 }; // Reduced padding
    const chartHeight = containerHeight - padding.bottom - padding.top;
    
    // Dynamic Width: Ensure scroll if candles are many
    const candleWidth = 15; // Width per candle
    const minChartWidth = window.innerWidth; // At least full screen width
    const calculatedWidth = Math.max(minChartWidth, candleData.length * candleWidth);
    const chartWidth = calculatedWidth - padding.right;

    const getY = (price: number) => {
      return containerHeight - padding.bottom - ((price - minVal) / range) * chartHeight;
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
        const candleCenter = (index * (chartWidth / candleData.length)) + (chartWidth / candleData.length) / 2;

        setHoverData({
          price: d.close,
          change: diff,
          changePercent: diffPercent,
          y: getY(d.close),
          x: candleCenter,
          date: d.dateLabel
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
           style={{ top: '30px', height: '5cm', justifyContent: 'space-between' }}
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
              style={{ cursor: 'crosshair' }}
           >
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = containerHeight - padding.bottom - (ratio * chartHeight);
                 return (
                   <line 
                     key={i} 
                     x1={0} y1={y} 
                     x2={calculatedWidth} y2={y} 
                     stroke="#f3f4f6" 
                     strokeWidth="1" 
                   />
                 );
              })}

              {/* X-Axis Labels */}
              {candleData.map((d, i) => {
                 if (i % 5 !== 0) return null;
                 const x = (i * (chartWidth / candleData.length)) + (chartWidth / candleData.length) / 2;
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
                  const color = isUp ? '#ef4444' : '#3b82f6'; 
                  const barW = (chartWidth / candleData.length);
                  const wickX = (i * barW) + barW / 2;
                  const bodyX = (i * barW) + 2; 
                  const bodyWidth = Math.max(barW - 4, 2);

                  const yOpen = getY(d.open);
                  const yClose = getY(d.close);
                  const yHigh = getY(d.high);
                  const yLow = getY(d.low);

                  return (
                    <g key={i}>
                      <line 
                        x1={wickX} y1={yHigh} 
                        x2={wickX} y2={yLow} 
                        stroke={isUp ? '#fca5a5' : '#93c5fd'} 
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
                        x1={hoverData.x} y1={padding.top} 
                        x2={hoverData.x} y2={containerHeight - padding.bottom} 
                        stroke="#2D8C69" 
                        strokeWidth="1" 
                        strokeDasharray="4 4"
                        opacity="0.8"
                     />
                     {/* Horizontal Line */}
                     <line 
                        x1={0} y1={hoverData.y} 
                        x2={calculatedWidth} y2={hoverData.y} 
                        stroke="#2D8C69" 
                        strokeWidth="1" 
                        strokeDasharray="4 4"
                        opacity="0.8"
                     />
                     
                     {/* Price Tag (Left Floating) */}
                     <g transform={`translate(${hoverData.x + 10}, ${hoverData.y - 12})`}>
                       <rect 
                          x="0" y="0" 
                          width="60" height="28" 
                          rx="6" 
                          fill="#2D8C69" 
                          filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.1))"
                       />
                       <text x="30" y="14" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white" dy="0.3em">
                         {Math.round(hoverData.price).toLocaleString()}
                       </text>
                     </g>

                     {/* Date Tag (Bottom Floating) */}
                     <g transform={`translate(${hoverData.x}, ${containerHeight - padding.bottom + 5})`}>
                        <rect x="-20" y="0" width="40" height="20" rx="4" fill="#374151" />
                        <text x="0" y="14" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">{hoverData.date}</text>
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
              <span className="text-[11px] font-black text-gray-800">{Math.round(maxVal).toLocaleString()}원</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-gray-400">최저</span>
              <span className="text-[11px] font-black text-gray-800">{Math.round(minVal).toLocaleString()}원</span>
            </div>
          </div>

          <div className="flex bg-gray-100/80 p-0.5 rounded-xl space-x-0.5">
            {['1일', '1주', '1달', '1년'].map((period) => (
              <button
                key={period}
                onClick={() => setChartPeriod(period as any)}
                className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all ${
                  chartPeriod === period ? 'bg-white text-[#2D8C69] shadow-sm' : 'text-gray-400 hover:text-gray-600'
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

  const renderNews = () => {
      const displayedNews = newsListMock.slice(0, newsDisplayCount);
      const hasMore = newsListMock.length > newsDisplayCount;
      return (
          <div className="flex-1 flex flex-col overflow-y-auto hide-scrollbar animate-in fade-in duration-500 mb-2 pb-8">
              <div className="space-y-4">
                  {displayedNews.map((news) => (
                      <div key={news.id} onClick={() => setSelectedNews(news)} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-50 cursor-pointer">
                          <h3 className="text-[14px] font-bold text-gray-800">{news.title}</h3>
                          <span className="text-[10px] text-gray-400 mt-2 block">{news.time} • {news.source}</span>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  const renderAdvice = () => (
      <div className="flex-1 flex flex-col space-y-4 overflow-y-auto hide-scrollbar animate-in fade-in duration-500 pb-8">
          {agentAdvices.map((agent) => (
              <div key={agent.id} className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-3 mb-2">
                       <img src={agent.avatar} className="w-10 h-10 rounded-full bg-gray-50" alt="avatar"/>
                       <div>
                           <h3 className="text-sm font-black text-gray-800">{agent.type}</h3>
                           <div className="flex gap-1">{agent.tags.map((t, i) => <span key={i} className={`text-[9px] px-1.5 rounded ${agent.tagBg} ${agent.tagColor}`}>{t}</span>)}</div>
                       </div>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{agent.text}</p>
              </div>
          ))}
      </div>
  );

  const renderNewsModal = () => {
    if (!selectedNews) return null;
    return (
      <div className="absolute inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
        <div className="bg-white w-full h-[90%] sm:h-[80%] sm:w-[90%] rounded-t-3xl sm:rounded-3xl p-6 flex flex-col animate-in slide-in-from-bottom duration-300 shadow-2xl">
          <div className="flex justify-between items-start mb-4 shrink-0">
            <span className="bg-[#2D8C69]/10 text-[#2D8C69] px-3 py-1 rounded-full text-xs font-black">{selectedNews.category}</span>
            <button onClick={() => setSelectedNews(null)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar">
            <h2 className="text-xl font-black text-gray-800 mb-3 leading-snug">{selectedNews.title}</h2>
            <div className="flex items-center space-x-2 text-xs text-gray-400 font-bold mb-6 border-b border-gray-50 pb-4">
              <span>{selectedNews.source}</span>
              <span>•</span>
              <span>{selectedNews.time}</span>
            </div>
            <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-medium pb-10">
              {selectedNews.content}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTradeModal = () => {
    if (!isTradeModalOpen) return null;
    const keypad = [["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["00", "0", "back"]];
    
    return (
      <div className="absolute inset-0 z-[100] flex flex-col bg-white animate-in slide-in-from-bottom duration-300">
        {/* Header with 3 Tabs */}
        <div className="px-6 pt-8 pb-0 flex items-center justify-between border-b border-gray-100">
          <div className="flex space-x-8">
             {[
               { key: 'buy', label: '매수' },
               { key: 'sell', label: '매도' },
               { key: 'pending', label: '미체결' }
             ].map(tab => (
                <button 
                  key={tab.key} 
                  onClick={() => setTradeTab(tab.key as any)} 
                  className={`pb-3 text-base font-black transition-colors ${
                    tradeTab === tab.key 
                      ? 'text-[#2D8C69] border-b-2 border-[#2D8C69]' 
                      : 'text-gray-300'
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
        {tradeTab === 'pending' ? (
          // Pending Orders Tab
          <div className="flex-1 overflow-y-auto p-6">
            {pendingOrders.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 font-bold">
                미체결 주문이 없습니다
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className={`text-sm font-black mb-1 ${
                        order.type === 'buy' ? 'text-red-500' : 'text-blue-500'
                      }`}>
                        {order.type === 'buy' ? '매수' : '매도'}
                      </div>
                      <div className="text-xs text-gray-500 font-bold">
                        {order.name} · {order.qty}주 · {order.price}원
                      </div>
                    </div>
                    <button 
                      onClick={() => cancelOrder(order.id)}
                      className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                    >
                      <X size={16} className="text-gray-500" />
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
                <span className="text-xs text-gray-400 font-bold">주문 가격</span>
                <button 
                  onClick={() => {
                    if (stock) {
                      const priceNum = parseInt(stock.price.replace(/[^0-9]/g, '')) || 0;
                      setOrderPrice(priceNum.toLocaleString());
                    }
                  }}
                  className="text-xs text-gray-500 font-bold hover:text-gray-700"
                >
                  현재 가격으로
                </button>
              </div>
              <div 
                onClick={() => setFocusedField('price')}
                className={`text-2xl font-black cursor-pointer transition-colors ${
                  focusedField === 'price' ? 'text-[#2D8C69]' : 'text-gray-800'
                }`}
              >
                {orderPrice}원
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 font-bold">일반 | 소수점</span>
                <span 
                  onClick={() => setFocusedField('amount')}
                  className={`text-lg font-black cursor-pointer transition-colors ${
                    focusedField === 'amount' ? 'text-[#2D8C69]' : 'text-gray-800'
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
                  {k === 'back' ? <Delete size={20} /> : k}
                </button>
              ))}
            </div>

            {/* Bottom Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-auto">
              <button 
                onClick={() => setIsTradeModalOpen(false)}
                className="py-4 bg-gray-400 text-white rounded-xl font-black text-base"
              >
                취소
              </button>
              <button 
                onClick={executeOrder}
                className={`py-4 text-white rounded-xl font-black text-base ${
                  tradeTab === 'buy' 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                입력
              </button>
            </div>
          </div>
        )}
      </div>
    )
  };

  // if (!stock) return <div className="flex items-center justify-center h-full">로딩중...</div>;

  return (
    // Replaced fixed overlay with flex column, letting Layout handle the frame
    <div className="flex flex-col h-full bg-[#F4F8F6] animate-in slide-in-from-right duration-300 overflow-hidden">
      
      {/* Header */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between shrink-0 bg-[#F4F8F6]">
        <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm hover:text-gray-600 active:scale-95 transition-all">
            <ChevronLeft size={24} />
        </button>
        <div className="text-center">
             <h2 className="text-lg font-black text-gray-800">{stock.name}</h2>
             <span className="text-xs font-bold text-gray-400">{stock.price}</span>
        </div>
        <button onClick={onToggleWatchlist} className={`w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all ${isLiked ? 'text-red-500' : 'text-gray-300'}`}>
            <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Price Hero Section */}
      <div className="flex flex-col items-center py-4 shrink-0">
         <h1 className="text-4xl font-black text-gray-800 tracking-tighter mb-1">{stock.price}</h1>
         <div className={`flex items-center space-x-1 font-black ${isStockUp ? 'text-red-500' : 'text-blue-500'}`}>
             <span className="text-sm">{stock.change}</span>
             <span className="text-xs bg-opacity-10 px-1.5 py-0.5 rounded-md bg-current">{isStockUp ? '▲' : '▼'}</span>
         </div>
      </div>

      {/* Tabs */}
      <div className="px-6 mb-4 shrink-0">
        <div className="bg-white p-1 rounded-2xl flex shadow-sm">
          {tabs.map((tab) => (
            <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${activeTab === tab ? 'bg-[#2D8C69] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
            >
                {tab}
            </button>
          ))}
        </div>
      </div>
      

      {/* Content Area - Scrollable */}
      <div className="flex-1 px-6 overflow-y-auto hide-scrollbar flex flex-col pb-6">
         {activeTab === '차트' && (
            <>
              {renderChart()}
              {/* Buy/Sell Buttons below Chart */}
              <div className="mt-4 flex items-center space-x-4 shrink-0">
                <button 
                    onClick={() => { setTradeTab('sell'); setIsTradeModalOpen(true); }} 
                    className="flex-1 bg-white border border-[#2D8C69]/20 rounded-[1.5rem] py-4 font-black text-[#2D8C69] shadow-sm active:scale-95 transition-all text-lg"
                >
                    팔게요
                </button>
                <button 
                    onClick={() => { setTradeTab('buy'); setIsTradeModalOpen(true); }} 
                    className="flex-1 bg-[#2D8C69] hover:bg-[#257a5b] text-white rounded-[1.5rem] py-4 font-black text-lg shadow-lg shadow-[#2D8C69]/20 active:scale-95 transition-all"
                >
                    살게요
                </button>
              </div>
            </>
         )}
         {activeTab === '호가' && renderOrderBook()}
         {activeTab === '뉴스' && renderNews()}
         {activeTab === '조언' && renderAdvice()}
         {activeTab === '토론' && <div className="flex items-center justify-center h-40 text-gray-400 font-bold">토론 기능 준비중</div>}
      </div>

      {renderTradeModal()}
      {renderNewsModal()}
    </div>
  );
};

export default StockDetail;
