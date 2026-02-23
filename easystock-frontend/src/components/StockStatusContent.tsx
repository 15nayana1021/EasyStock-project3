import React, { useState, useEffect } from "react";
import { Leaf, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  StockData,
  WatchlistItem,
  PortfolioItem,
  TransactionItem,
} from "../types";
import { fetchMyOrders, cancelOrder, fetchAllOrders } from "../services/api";
import StatusTour from "./onboarding/StatusTour";

interface SolutionItem {
  id: number;
  type: string;
  text: string;
  avatarSeed: string;
  avatarType: "fox" | "wolf" | "owl";
  imageUrl: string;
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

const solutionData: SolutionItem[] = [
  {
    id: 1,
    type: "공격형 여우",
    text: "일단 지르고 보는 스타일이시네요. 지금처럼 과감한 베팅이 들어맞을 때도 있겠지만, 리스크가 큰 만큼 언제든 급락할 수도 있습니다! 신중하게 투자하세요!",
    avatarSeed: "Garrett",
    avatarType: "fox",
    imageUrl: "/Aggressive_Fox.png",
  },
  {
    id: 2,
    type: "안정형 여우",
    text: "투자금이 너무 많으시네요, 예진 님. 자산의 80%가 삼성전자에 몰려 있는 건 위험해요. 수익의 일부는 우량주나 현금으로 옮겨서 소중한 자산을 안전하게 지켜보아요.",
    avatarSeed: "Felix",
    avatarType: "wolf",
    imageUrl: "/Stable_Fox.png",
  },
  {
    id: 3,
    type: "비관형 여우",
    text: "지금 조금 자산을 관리를 한다해도 모릅니다. 시장 지표가 과열 상태예요. 지금 다 털고 도망치는 게 상책입니다. 자존심을 듣지 않으면 큰 코 다칠 겁니다.",
    avatarSeed: "Jasper",
    avatarType: "wolf",
    imageUrl: "/Pessimistic_Fox.png",
  },
];

const StockStatusContent: React.FC<StockStatusContentProps> = ({
  watchlist,
  onToggleWatchlist,
  cash,
  portfolio,
  virtualDate,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"status" | "history" | "solution">(
    "status",
  );
  const [transactionFilter, setTransactionFilter] = useState<
    "all" | "buy" | "sell"
  >("all");
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(5);

  const [pendingList, setPendingList] = useState<any[]>([]);
  const [filledList, setFilledList] = useState<any[]>([]);
  const userId = localStorage.getItem("stocky_user_id") || "1";
  const [statusTourCompleted, setStatusTourCompleted] = useState(
    () => localStorage.getItem("status-tour-done") === "true",
  );
  const [showStatusTour, setShowStatusTour] = useState(false);

  useEffect(() => {
    const checkTourStatus = () => {
      const isStatusPending =
        localStorage.getItem("status-highlight-pending") === "true";
      if (!statusTourCompleted && isStatusPending) {
        setShowStatusTour(true);
      }
    };
    checkTourStatus();
    window.addEventListener("check-status-highlight", checkTourStatus);
    return () =>
      window.removeEventListener("check-status-highlight", checkTourStatus);
  }, [statusTourCompleted]);

  const handleTourComplete = () => {
    setStatusTourCompleted(true);
    setShowStatusTour(false);
    localStorage.removeItem("status-highlight-pending");
    window.dispatchEvent(new Event("check-status-highlight"));
  };

  const totalStockValue = portfolio.reduce((acc, item) => {
    const price =
      typeof item.current_price === "number"
        ? item.current_price
        : item.average_price;
    const qty = item.quantity || item.sharesCount || 0;
    return acc + price * qty;
  }, 0);
  const totalPurchaseAmount = portfolio.reduce((acc, item) => {
    const qty = item.quantity || item.sharesCount || 0;
    return acc + item.average_price * qty;
  }, 0);

  const totalAssets = cash + totalStockValue;
  const unrealizedPnL = totalStockValue - totalPurchaseAmount;
  const returnRate =
    totalPurchaseAmount > 0 ? (unrealizedPnL / totalPurchaseAmount) * 100 : 0;
  const isProfitable = unrealizedPnL >= 0;

  // API 데이터 호출 로직
  useEffect(() => {
    if (activeTab === "history") {
      const loadOrders = async () => {
        const orders = await fetchMyOrders(userId);
        const allOrders = await fetchAllOrders(userId);
        setPendingList(orders.filter((o: any) => o.status === "PENDING"));
        setFilledList(allOrders.filter((o: any) => o.status === "FILLED"));
      };
      loadOrders();
      const interval = setInterval(loadOrders, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab, userId]);

  const handleCancelOrder = async (orderId: number) => {
    if (window.confirm("정말 이 주문을 취소하시겠습니까?")) {
      const res = await cancelOrder(orderId);
      if (res && res.success !== false) {
        alert("주문이 취소되었습니다.");
        setPendingList((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        alert("주문 취소 실패");
      }
    }
  };

  // 1. 주식현황 탭 (팀원 디자인 완벽 적용)
  const renderStatusView = () => (
    <div className="flex flex-col animate-in fade-in duration-300 pb-32">
      <div id="status-total-assets" className="relative mt-2 mb-8 px-5">
        <div className="bg-[#004FFE] rounded-[2.5rem] p-6 shadow-xl shadow-blue-900/20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="flex flex-col space-y-1 relative z-10">
            <span className="text-[11px] text-white/70 font-bold flex items-center">
              <span className="mr-1 opacity-80"></span>총 보유자산
            </span>
            <h1 className="text-2xl font-black text-white tracking-tighter mb-4">
              {totalAssets.toLocaleString()}원
            </h1>
            <div className="h-[1px] w-full bg-white/10 my-2"></div>
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] text-white/50 font-bold">
                  평가손익
                </span>
                <span
                  className={`text-sm font-black ${isProfitable ? "text-red-300" : "text-blue-300"}`}
                >
                  {isProfitable ? "+" : ""}
                  {unrealizedPnL.toLocaleString()}원
                </span>
              </div>
              <div className="w-[1px] h-8 bg-white/10"></div>
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-white/50 font-bold">
                  수익률
                </span>
                <span
                  className={`text-sm font-black ${isProfitable ? "text-red-300" : "text-blue-300"}`}
                >
                  {isProfitable ? "+" : ""}
                  {returnRate.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="status-portfolio-list" className="mb-8 px-5">
        <div className="flex items-center space-x-1 mb-4 cursor-pointer group">
          <h2 className="text-lg font-black text-gray-800">
            보유자산 포트폴리오
          </h2>
          <ChevronRight
            size={18}
            className="text-gray-300 group-hover:translate-x-0.5 transition-transform"
          />
        </div>
        <div className="space-y-4">
          {portfolio.length > 0 ? (
            portfolio.map((item, index) => {
              const isUp = item.profit_rate >= 0;
              const displayName = tickerToName[item.name] || item.name;
              return (
                <div
                  key={index}
                  onClick={() => navigate(`/stock/${item.name}`)}
                  className="bg-white rounded-[1.5rem] p-4 flex items-center justify-between shadow-sm border border-gray-50/50 cursor-pointer active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#004FFE] flex items-center justify-center text-white font-black text-xl shadow-sm">
                      {displayName.charAt(0)}
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-gray-800 text-sm">
                          {displayName}
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-gray-400">
                        {item.quantity || item.sharesCount}주
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-sm font-black text-gray-800">
                      {(
                        (item.current_price || item.average_price) *
                        (item.quantity || item.sharesCount || 0)
                      ).toLocaleString()}
                      원
                    </span>
                    <div
                      className={`flex items-center text-[11px] font-black ${isUp ? "text-[#E53935]" : "text-[#1E88E5]"}`}
                    >
                      {isUp ? "▲" : "▼"} {Math.abs(item.profit_rate).toFixed(2)}
                      %
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-400 text-xs font-bold bg-white rounded-[1.5rem] border border-gray-50/50">
              보유한 주식이 없습니다.
            </div>
          )}
        </div>
      </div>

      <div id="status-watchlist" className="mb-4 px-5">
        <div className="flex items-center space-x-1 mb-4">
          <h2 className="text-lg font-black text-gray-800">관심 종목</h2>
          <span className="text-[#E53935]">❤️</span>
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
                  <div className="w-12 h-12 rounded-2xl bg-gray-200 flex items-center justify-center text-gray-600 font-black text-xl shadow-sm">
                    {item.logoText || item.name.charAt(0)}
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-gray-800 text-sm">
                        {item.name}
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-gray-400">
                      {item.price}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`flex items-center text-[11px] font-black ${item.isUp ? "text-[#E53935]" : "text-[#1E88E5]"}`}
                  >
                    {item.change} {item.isUp ? "▲" : "▼"}
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

  // 2. 거래내역 탭
  const renderHistoryView = () => {
    const getTransactionDate = (item: any) => {
      // 1순위: DB에 예쁘게 저장된 주문 당시 가상 날짜 (최근에 주문한 건 이걸 탑니다!)
      if (item.game_date) return item.game_date;

      // 2순위: 옛날 데이터라 가상 날짜가 텅 빈 '미체결' 주문이라면? -> 현재 가상 날짜(virtualDate)로 강제 표시!
      if (item.status === "PENDING" || !item.created_at) return virtualDate;

      // 3순위: 최후의 수단 (실제 생성일 날짜만 자르기)
      if (item.created_at) return item.created_at.split(" ")[0];

      return virtualDate;
    };
    // 필터 로직 적용
    const filterData = (list: any[]) => {
      if (transactionFilter === "all") return list;
      return list.filter((item) => {
        const isBuy =
          item.side === "BUY" ||
          item.order_type === "BUY" ||
          item.order_type === "매수";
        return transactionFilter === "buy" ? isBuy : !isBuy;
      });
    };

    const filteredPending = filterData(pendingList);
    const filteredFilled = filterData(filledList);
    const visibleFilled = filteredFilled.slice(0, visibleHistoryCount);
    const hasMoreFilled = filteredFilled.length > visibleHistoryCount;

    return (
      <div className="flex flex-col bg-[#CFE3FA] animate-in fade-in duration-300 pb-32">
        {/* 거래내역 헤더 디자인 */}
        <div
          className="p-6 pb-8 relative overflow-hidden rounded-b-[2rem]"
          style={{
            background: "linear-gradient(135deg, #3082F5 0%, #004FFE 100%)",
          }}
        >
          <div className="flex flex-col space-y-1 relative z-10">
            <h2 className="text-2xl font-black text-white tracking-tight">
              주식 거래 내역
            </h2>
            <p className="text-xs font-bold text-white/70">
              최근 보유 종목 거래 현황입니다.
            </p>
          </div>
          <div className="absolute right-4 top-4 text-white/10">
            <Leaf size={64} fill="currentColor" />
          </div>
        </div>

        {/* 거래 필터 버튼 */}
        <div className="flex space-x-2 px-4 pt-4 pb-0">
          {(["all", "buy", "sell"] as const).map((filter) => {
            const label =
              filter === "all" ? "전체" : filter === "buy" ? "매수" : "매도";
            const isActive = transactionFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => {
                  setTransactionFilter(filter);
                  setVisibleHistoryCount(5);
                }}
                className={`px-4 py-1.5 rounded-full text-[11px] font-black transition-all ${
                  isActive
                    ? "bg-[#004FFE] text-white shadow-md"
                    : "bg-gray-200/50 text-gray-400"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="px-4 py-4 relative z-20">
          <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-gray-100/50">
            <div className="divide-y divide-gray-50">
              {/* 미체결 내역 (취소버튼 포함) */}
              {filteredPending.map((item) => {
                const isBuy =
                  item.side === "BUY" ||
                  item.order_type === "BUY" ||
                  item.order_type === "매수";
                return (
                  <div
                    key={`pending-${item.id}`}
                    className="p-5 hover:bg-gray-50/50 transition-colors bg-blue-50/30"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="bg-[#E53935]/10 text-[#E53935] text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse">
                          대기중
                        </span>
                        <span className="text-xs font-black text-gray-400">
                          {isBuy ? "주식매수" : "주식매도"}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-gray-300">
                        {getTransactionDate(item)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <h3 className="text-lg font-black text-gray-800 leading-none mb-1">
                          {tickerToName[
                            item.company_name || item.ticker || ""
                          ] ||
                            item.company_name ||
                            item.ticker}
                        </h3>
                        <span className="text-[11px] font-bold text-gray-400">
                          {item.quantity}주 · {item.price.toLocaleString()}원
                        </span>
                      </div>
                      <button
                        onClick={() => handleCancelOrder(item.id)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-black transition-colors"
                      >
                        취소하기
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 체결완료 내역 (팀원 디자인) */}
              {visibleFilled.map((item) => {
                const isBuy =
                  item.side === "BUY" ||
                  item.order_type === "BUY" ||
                  item.order_type === "매수";
                return (
                  <div
                    key={`filled-${item.id}`}
                    className="p-5 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="bg-[#F5F8FC] text-[#004FFE] text-[10px] font-black px-2.5 py-1 rounded-full">
                          거래완료
                        </span>
                        <span className="text-xs font-black text-gray-400">
                          {isBuy ? "주식매수" : "주식매도"}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-gray-300">
                        {getTransactionDate(item)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <h3 className="text-lg font-black text-gray-800 leading-none mb-1">
                          {tickerToName[
                            item.company_name || item.ticker || ""
                          ] ||
                            item.company_name ||
                            item.ticker}
                        </h3>
                        <span className="text-[11px] font-bold text-gray-300">
                          {item.quantity}주 · {item.price.toLocaleString()}원
                        </span>
                      </div>
                      <div className="text-right flex items-center space-x-1">
                        <span
                          className={`${isBuy ? "text-[#E53935]" : "text-[#1E88E5]"} text-lg font-black tracking-tighter`}
                        >
                          {isBuy ? "-" : "+"}
                          {""}
                          {(item.quantity * item.price).toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredFilled.length > 0 && (
                <div className="flex gap-2 p-4 pt-2 bg-white">
                  {hasMoreFilled && (
                    <button
                      onClick={() => setVisibleHistoryCount((prev) => prev + 5)}
                      className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center space-x-2 text-gray-500 font-bold text-xs transition-all active:scale-[0.98] border border-gray-100"
                    >
                      <ChevronDown size={14} />
                      <span>
                        더보기 ({filteredFilled.length - visibleHistoryCount}개
                        남음)
                      </span>
                    </button>
                  )}

                  {visibleHistoryCount > 5 && (
                    <button
                      onClick={() => setVisibleHistoryCount(5)}
                      className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center space-x-2 text-gray-500 font-bold text-xs transition-all active:scale-[0.98] border border-gray-100"
                    >
                      <ChevronUp size={14} />
                      <span>접기</span>
                    </button>
                  )}
                </div>
              )}

              {filteredPending.length === 0 && filteredFilled.length === 0 && (
                <div className="p-10 text-center text-gray-400 font-bold text-sm">
                  거래 내역이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 3. 솔루션 탭
  const renderSolutionView = () => (
    <div className="flex flex-col bg-[#CFE3FA] animate-in fade-in duration-300 px-4 pt-4 pb-32">
      {solutionData.map((solution) => (
        <div
          key={solution.id}
          className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100/50 relative overflow-hidden group hover:shadow-md transition-all"
          style={{ marginBottom: "16px" }}
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
            <div className="w-28 h-24 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              <img
                src={solution.imageUrl}
                alt={solution.type}
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

  return (
    <div className="flex flex-col h-full bg-[#CFE3FA] rounded-t-[2.5rem] border border-white/50 shadow-inner overflow-hidden">
      {showStatusTour && (
        <StatusTour
          onComplete={handleTourComplete}
          onSelectTab={setActiveTab}
          onNavigateHome={() => navigate("/assets")}
        />
      )}

      <div className="p-5 pb-3 shrink-0">
        <div className="bg-gray-100/50 p-1 rounded-2xl flex items-center justify-between">
          <button
            onClick={() => setActiveTab("status")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === "status" ? "bg-[#004FFE] text-white shadow-sm" : "text-gray-400"}`}
          >
            주식현황
          </button>
          <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
          <button
            id="status-tab-history"
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === "history" ? "bg-[#004FFE] text-white shadow-sm" : "text-gray-400"}`}
          >
            거래내역
          </button>
          <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
          <button
            id="status-tab-solution"
            onClick={() => setActiveTab("solution")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === "solution" ? "bg-[#004FFE] text-white shadow-sm" : "text-gray-400"}`}
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
