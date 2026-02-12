import React, { useState } from "react";
import { Leaf, ChevronRight } from "lucide-react";
import StockDetail from "./StockDetail";
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
}) => {
  const [activeTab, setActiveTab] = useState<"status" | "history" | "solution">(
    "status",
  );
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);

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
      />
    );
  }

  const renderHistoryView = () => (
    <div className="flex flex-col bg-[#F4F5FB] animate-in fade-in duration-300 pb-32">
      <div className="bg-gradient-to-br from-[#40856C] to-[#2D8C69] p-6 pb-8 relative overflow-hidden rounded-b-[2rem]">
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

      <div className="px-4 py-6 relative z-20">
        <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-gray-100/50">
          <div className="divide-y divide-gray-50">
            {transactions.length > 0 ? (
              transactions.map((item) => (
                <div
                  key={item.id}
                  className="p-5 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="bg-[#E8F3EF] text-[#2D8C69] text-[10px] font-black px-2.5 py-1 rounded-full">
                        거래완료
                      </span>
                      <span className="text-xs font-black text-gray-400">
                        {item.type === "buy" ? "주식매수" : "주식매도"}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-gray-300">
                      {item.date} {item.time}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 rounded-2xl border border-gray-100 flex items-center justify-center p-2 bg-white shadow-sm overflow-hidden ${
                          item.logoBg || ""
                        }`}
                      >
                        {item.logoUrl ? (
                          <img
                            src={item.logoUrl}
                            alt={item.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span
                            className={`font-black text-xs ${
                              item.logoBg ? "text-white" : "text-gray-600"
                            }`}
                          >
                            {item.logoText}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-lg font-black text-gray-800 leading-none mb-1">
                          {item.name}
                        </h3>
                        <span className="text-[11px] font-bold text-gray-300">
                          {item.qty} · {item.pricePerShare}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex items-center space-x-1">
                      <span
                        className={`${
                          item.type === "buy" ? "text-red-500" : "text-blue-500"
                        } text-lg font-black tracking-tighter`}
                      >
                        {item.type === "buy" ? "" : "+"} {item.amount}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-gray-400 font-bold text-sm">
                거래 내역이 없습니다.
              </div>
            )}
          </div>
        </div>
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
        <div className="bg-gradient-to-br from-[#40856C] via-[#2D8C69] to-[#247054] rounded-[2.5rem] p-6 shadow-xl shadow-green-900/20 relative overflow-hidden">
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
                  보유 현금
                </span>
                <span className="text-sm font-bold text-white/90">
                  {cash.toLocaleString()}원
                </span>
              </div>
              <div className="w-[1px] h-8 bg-white/10"></div>
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-white/50 font-bold">
                  주식 평가금
                </span>
                <span className="text-sm font-black text-white">
                  {stockValue.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 px-5">
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
            portfolio.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedStock(item)}
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
                onClick={() => setSelectedStock(item)}
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
