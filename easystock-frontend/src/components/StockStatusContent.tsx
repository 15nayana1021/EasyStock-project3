import React, { useState } from "react";
import { Leaf, ChevronRight } from "lucide-react";
import { fetchAllOrders } from "../services/api";
import StockDetail from "./StockDetail";
import { useNavigate } from "react-router-dom";
import {
  StockData,
  WatchlistItem,
  PortfolioItem,
  TransactionItem,
} from "../types";

interface SolutionItem {
  id: number;
  type: string;
  text: string;
  avatarSeed: string;
  avatarType: "fox" | "wolf" | "owl";
}

interface StockStatusContentProps {
  watchlist: WatchlistItem[];
  onToggleWatchlist: (stock: StockData) => void;
  cash: number;
  portfolio: PortfolioItem[];
  transactions: TransactionItem[];
  onBuy: (stock: StockData, price: number, qty: number) => void;
  onSell: (stock: StockData, price: number, qty: number) => void;
  virtualDate: string;
}

interface OrderHistoryItem {
  id: number;
  created_at: string;
  company_name: string;
  side: "BUY" | "SELL";
  price: number;
  quantity: number;
  status: "FILLED" | "PENDING" | "CANCELLED";
  game_date?: string;
}

const solutionData: SolutionItem[] = [
  {
    id: 1,
    type: "공격형 여우",
    text: "일단 지르고 보는 스타일이시네요. 지금처럼 과감한 베팅이 들어맞을 때도 있겠지만, 리스크가 큰 만큼 언제든 급락할 수도 있습니다! 신중하게 투자하세요!",
    avatarSeed: "Garrett",
    avatarType: "fox",
  },
  {
    id: 2,
    type: "안정형 여우",
    text: "투자금이 너무 많으시네요, 예진 님. 자산의 80%가 삼성전자에 몰려 있는 건 위험해요. 수익의 일부는 우량주나 현금으로 옮겨서 소중한 자산을 안전하게 지켜보아요.",
    avatarSeed: "Felix",
    avatarType: "wolf",
  },
  {
    id: 3,
    type: "비관형 여우",
    text: "지금 조금 자산을 관리를 한다해도 모릅니다. 시장 지표가 과열 상태예요. 지금 다 털고 도망치는 게 상책입니다. 자존심을 듣지 않으면 큰 코 다칠 겁니다.",
    avatarSeed: "Jasper",
    avatarType: "wolf",
  },
];

const StockStatusContent: React.FC<StockStatusContentProps> = ({
  watchlist,
  onToggleWatchlist,
  cash,
  portfolio,
  transactions,
  onBuy,
  onSell,
  virtualDate,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"status" | "history" | "solution">(
    "status",
  );
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [historyFilter, setHistoryFilter] = useState<"ALL" | "BUY" | "SELL">(
    "ALL",
  );
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const loadHistory = async () => {
      if (activeTab === "history") {
        setLoading(true);
        try {
          const userId = localStorage.getItem("stocky_user_id") || "1";
          const data = await fetchAllOrders(userId);
          setOrderHistory(data);
        } catch (error) {
          console.error("거래 내역 로드 실패", error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadHistory();
  }, [activeTab]);

  // 날짜별 그룹화 및 필터링 로직
  const getGroupedHistory = () => {
    // 1. 필터링 (기존 유지)
    const filtered = orderHistory.filter((item) => {
      if (historyFilter === "ALL") return true;
      const side = item.side || (item as any).order_type;
      return (
        side === historyFilter ||
        side === (historyFilter === "BUY" ? "매수" : "매도")
      );
    });

    // 2. 날짜별 그룹화
    const groups: { [date: string]: OrderHistoryItem[] } = {};

    filtered.forEach((item) => {
      // const dateObj = new Date(item.created_at);
      // const dateKey = `${dateObj.getMonth() + 1}.${dateObj.getDate()} ...`;

      const dateKey = item.game_date || virtualDate;

      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });

    return groups;
  };

  const groupedHistory = getGroupedHistory();
  const sortedDates = Object.keys(groupedHistory).sort((a, b) =>
    b.localeCompare(a),
  );

  // 헬퍼 함수들
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  const getStatusBadge = (status: string) => {
    const s = String(status).toUpperCase();
    if (s === "FILLED")
      return (
        <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded font-bold">
          체결
        </span>
      );
    if (s === "PENDING")
      return (
        <span className="bg-orange-50 text-orange-500 text-[10px] px-1.5 py-0.5 rounded font-bold">
          미체결
        </span>
      );
    if (s === "CANCELLED")
      return (
        <span className="bg-red-50 text-red-400 text-[10px] px-1.5 py-0.5 rounded font-bold">
          취소
        </span>
      );
    return null;
  };

  // 1. 주식 평가액 계산 (에러 방지 로직 포함)
  const stockValue = portfolio.reduce((acc, item) => {
    let priceNum = 0;

    // 가격 데이터가 숫자면 그대로 쓰고, 문자열이면 숫자만 추출합니다
    if (typeof item.price === "number") {
      priceNum = item.price;
    } else if (item.price && typeof item.price === "string") {
      priceNum = parseInt(item.price.replace(/[^0-9]/g, "")) || 0;
    } else if ((item as any).current_price) {
      priceNum = (item as any).current_price;
    }

    return acc + priceNum * (item.sharesCount || 0);
  }, 0);

  const totalStockValue = portfolio.reduce((acc, item) => {
    const price =
      typeof item.current_price === "number"
        ? item.current_price
        : item.average_price;
    return acc + price * item.quantity;
  }, 0);

  // 총 매수 금액 (원금 기준)
  const totalInvested = portfolio.reduce((acc, item) => {
    return acc + item.average_price * item.quantity;
  }, 0);

  // 총 자산 = 현금 + 총 주식 평가금
  const totalAsset = cash + totalStockValue;

  // 평가손익 및 수익률 계산
  const totalProfit = totalStockValue - totalInvested;
  const profitRate =
    totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  // 2. 총 자산 계산
  const totalAssets = (cash || 0) + stockValue;

  if (selectedStock) {
    const isLiked = watchlist.some((item) => item.name === selectedStock.name);
    return (
      <StockDetail
        stock={selectedStock}
        isLiked={isLiked}
        onToggleWatchlist={() => onToggleWatchlist(selectedStock)}
        onBack={() => setSelectedStock(null)}
        onBuy={onBuy}
        onSell={onSell}
        virtualDate={virtualDate}
      />
    );
  }

  const renderHistoryView = () => (
    <div className="flex flex-col bg-[#F4F5FB] animate-in fade-in duration-300 pb-32 h-full">
      {/* 1. 상단 헤더 (기존 디자인 유지) */}
      <div className="bg-gradient-to-br from-[#40856C] to-[#2D8C69] p-6 pb-8 relative overflow-hidden rounded-b-[2rem] shrink-0">
        <div className="flex flex-col space-y-1 relative z-10">
          <h2 className="text-2xl font-black text-black tracking-tight">
            주식 거래 내역
          </h2>
          <p className="text-xs font-bold text-black/70">
            실시간 주문 및 체결 현황입니다.
          </p>
        </div>
        <div className="absolute right-4 top-4 text-white/10">
          <Leaf size={64} fill="currentColor" />
        </div>
      </div>

      {/* 2. 필터 버튼 (새로 추가됨) */}
      <div className="px-6 mt-4 flex space-x-2 overflow-x-auto hide-scrollbar shrink-0">
        {[
          { id: "ALL", label: "전체" },
          { id: "BUY", label: "매수" },
          { id: "SELL", label: "매도" },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setHistoryFilter(filter.id as any)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
              historyFilter === filter.id
                ? "bg-gray-800 text-white border-gray-800 shadow-md"
                : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* 3. 거래 내역 리스트 (진짜 데이터 연동) */}
      <div className="px-4 py-4 flex-1 overflow-y-auto hide-scrollbar">
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-xs">
            로딩중...
          </div>
        ) : orderHistory.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-10 flex flex-col items-center justify-center text-gray-400 shadow-sm border border-gray-50/50 min-h-[200px]">
            <p className="text-sm font-bold">거래 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-6 pb-20">
            {sortedDates.map((date) => (
              <div
                key={date}
                className="animate-in slide-in-from-bottom-2 duration-500"
              >
                {/* 날짜 헤더 */}
                <h3 className="text-xs font-bold text-gray-500 mb-2 ml-2 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2"></span>
                  {date}
                </h3>

                {/* 해당 날짜의 주문 카드들 */}
                <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100/50 overflow-hidden divide-y divide-gray-50">
                  {groupedHistory[date].map((order) => {
                    // 데이터 가공
                    const side = order.side || (order as any).order_type;
                    const isBuy =
                      String(side).toUpperCase() === "BUY" || side === "매수";
                    const isFilled = order.status === "FILLED";

                    return (
                      <div
                        key={order.id}
                        className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between"
                      >
                        {/* 왼쪽 정보 */}
                        <div className="flex items-center space-x-3">
                          {/* 매수/매도 아이콘 */}
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${isBuy ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"}`}
                          >
                            <span className="text-[10px] font-black">
                              {isBuy ? "매수" : "매도"}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-black text-gray-800 leading-none">
                                {order.company_name}
                              </h3>
                              {getStatusBadge(order.status)}
                            </div>
                            <span className="text-[11px] font-bold text-gray-400 mt-1 block">
                              {order.quantity}주
                            </span>
                          </div>
                        </div>

                        {/* 오른쪽 정보 (금액) */}
                        <div className="text-right">
                          <span className="text-sm font-black text-gray-800 block">
                            {order.price.toLocaleString()}원
                          </span>
                          <span
                            className={`text-[10px] font-bold ${isFilled ? "text-gray-400" : "text-orange-500"}`}
                          >
                            {isFilled ? "거래완료" : "체결대기"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSolutionView = () => (
    <div className="flex flex-col bg-[#F4F8F6] animate-in fade-in duration-300 px-4 py-4 space-y-4 pb-32">
      {solutionData.map((solution) => (
        <div
          key={solution.id}
          className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100/50 relative overflow-hidden group hover:shadow-md transition-all"
        >
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, #000 1px, transparent 1px)",
              backgroundSize: "15px 15px",
            }}
          ></div>

          <div className="flex items-start space-x-4 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center p-1 shadow-inner shrink-0">
              <img
                src={`https://api.dicebear.com/7.x/big-ears-neutral/svg?seed=${solution.avatarSeed}&backgroundColor=transparent`}
                alt="Agent"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <div className="mb-2">
                <h3 className="text-base font-black text-gray-800 tracking-tight">
                  {solution.type}
                </h3>
              </div>
              <p className="text-[12px] font-bold text-gray-600 leading-relaxed tracking-tight">
                {solution.text}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderStatusView = () => (
    <div className="flex flex-col animate-in fade-in duration-300 pb-32">
      <div className="relative mt-2 mb-8 px-5">
        <div className="bg-[#2B8665] rounded-[2.5rem] p-6 shadow-md text-white">
          {/* 총 자산 영역 */}
          <div className="mb-4">
            <span className="text-white/80 text-[11px] font-bold tracking-wide">
              총 보유자산
            </span>
            <h2 className="text-2xl font-black mt-1 tracking-tight">
              {totalAsset.toLocaleString()}원
            </h2>
          </div>

          {/* 하단 평가손익 & 수익률 영역 */}
          <div className="flex items-center pt-4 border-t border-white/20">
            {/* 평가손익 */}
            <div className="flex-1">
              <span className="text-white/60 text-[10px] font-bold">
                평가손익
              </span>
              <p className="text-sm font-black mt-1 tracking-tight">
                {totalProfit > 0 ? "+ " : totalProfit < 0 ? "- " : ""}
                {Math.abs(totalProfit).toLocaleString()}원
              </p>
            </div>

            {/* 중간 세로 구분선 */}
            <div className="w-[1px] h-8 bg-white/20 mx-4"></div>

            {/* 수익률 */}
            <div className="flex-1 text-right">
              <span className="text-white/60 text-[10px] font-bold">
                수익률
              </span>
              <p className="text-sm font-black mt-1 tracking-tight">
                {profitRate > 0 ? "▲ +" : profitRate < 0 ? "▼ " : ""}
                {profitRate.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 px-5">
        <div className="flex items-center space-x-1 mb-4 cursor-pointer group">
          <h2 className="text-lg font-black text-gray-800"></h2>
          <ChevronRight
            size={18}
            className="text-gray-300 group-hover:translate-x-0.5 transition-transform"
          />
        </div>
        <div className="space-y-4">
          {portfolio.length > 0 ? (
            portfolio.map((item) => (
              <div
                key={item.ticker}
                onClick={() => navigate(`/stock/${item.ticker || item.name}`)}
                className="bg-white rounded-[1.5rem] p-4 flex items-center justify-between shadow-sm border border-gray-50/50 cursor-pointer active:scale-[0.98] transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center text-white font-black text-xl shadow-sm`}
                  >
                    {item.logoText}
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-gray-800 text-sm">
                        {item.name}
                      </h3>
                      <span className="bg-[#FEF3C7] text-[#D97706] text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none">
                        {item.badge}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-gray-300">
                      {item.shares}
                    </span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-sm font-black text-gray-800">
                    {item.price}
                  </span>
                  <div
                    className={`flex items-center text-[11px] font-black ${
                      item.isUp ? "text-red-500" : "text-blue-500"
                    }`}
                  >
                    {item.change} {item.isUp ? "▲" : "▼"}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400 text-xs font-bold bg-white rounded-[1.5rem] border border-gray-50/50">
              보유한 주식이 없습니다.
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 px-5">
        <div className="flex items-center space-x-1 mb-4">
          <h2 className="text-lg font-black text-gray-800">관심 종목</h2>
          <span className="text-red-400">❤️</span>
        </div>
        <div className="space-y-4">
          {watchlist.length > 0 ? (
            watchlist.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/stock/${item.name}`)}
                className="bg-white rounded-[1.5rem] p-4 flex items-center justify-between shadow-sm border border-gray-50/50 cursor-pointer active:scale-[0.98] transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center text-white font-black text-xl shadow-sm`}
                  >
                    {item.logoText}
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-gray-800 text-sm">
                        {item.name}
                      </h3>
                      {item.badge && (
                        <span className="bg-[#E9EEF3] text-gray-400 text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-gray-300">
                      {item.shares}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right flex flex-col items-end">
                    <span className="text-sm font-black text-gray-800">
                      {item.price}
                    </span>
                    <div
                      className={`flex items-center text-[11px] font-black ${
                        item.isUp ? "text-[#2D8C69]" : "text-blue-500"
                      }`}
                    >
                      {item.change} {item.isUp ? "▲" : "▼"}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-200" />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400 text-xs font-bold bg-white rounded-[1.5rem] border border-gray-50/50">
              아직 관심 종목이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#E8F3EF] rounded-t-[2.5rem] border border-white/50 shadow-inner overflow-hidden">
      <div className="p-5 pb-3 shrink-0">
        <div className="bg-gray-100/50 p-1 rounded-2xl flex items-center justify-between">
          <button
            onClick={() => setActiveTab("status")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeTab === "status"
                ? "bg-[#2D8C69] text-white shadow-sm"
                : "text-gray-400"
            }`}
          >
            주식현황
          </button>
          <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeTab === "history"
                ? "bg-[#2D8C69] text-white shadow-sm"
                : "text-gray-400"
            }`}
          >
            거래내역
          </button>
          <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
          <button
            onClick={() => setActiveTab("solution")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeTab === "solution"
                ? "bg-[#2D8C69] text-white shadow-sm"
                : "text-gray-400"
            }`}
          >
            솔루션
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {activeTab === "status" && renderStatusView()}
        {activeTab === "history" && renderHistoryView()}
        {activeTab === "solution" && renderSolutionView()}
      </div>
    </div>
  );
};

export default StockStatusContent;
