import React, { useEffect } from "react";
import { PortfolioItem } from "../types";

interface AssetsContentProps {
  cash: number;
  portfolio: PortfolioItem[];
  refreshData?: () => void;
}

const AssetsContent: React.FC<AssetsContentProps> = ({
  cash,
  portfolio,
  refreshData,
}) => {
  useEffect(() => {
    if (refreshData) {
      const interval = setInterval(() => {
        console.log("🔄 자산 정보 실시간 동기화 중...");
        refreshData();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [refreshData]);

  const stockValue = portfolio.reduce((acc, item) => {
    const price =
      typeof item.current_price === "number"
        ? item.current_price
        : item.average_price;

    // quantity 혹은 sharesCount로 수량 파악
    const qty =
      item.quantity !== undefined ? item.quantity : item.sharesCount || 0;

    return acc + price * qty;
  }, 0);

  const totalAssets = cash + stockValue;

  // 비중 계산
  const stockPercent =
    totalAssets > 0 ? Math.round((stockValue / totalAssets) * 100) : 0;
  const cashPercent = totalAssets > 0 ? 100 - stockPercent : 100;

  // 도넛 차트 계산
  const dashTotal = 251.2;
  const cashOffset = (stockPercent / 100) * dashTotal;

  return (
    <div className="flex flex-col h-full bg-white rounded-t-[2.5rem] border border-white/50 shadow-inner overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex justify-center">
          <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">
            나의 자산 현황
          </h2>
        </div>
      </div>

      {/* Internal Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 hide-scrollbar pb-32">
        <div className="flex flex-col items-center mt-4">
          {/* Doughnut Chart Visualization */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Simple SVG Doughnut */}
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full transform -rotate-90"
            >
              {/* Cash Segment (Base) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#DCE6F5"
                strokeWidth="14"
                strokeDasharray={`${dashTotal}`}
                strokeDashoffset="0"
              />
              {/* Stock Segment (Overlay) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#004FFE"
                strokeWidth="14"
                strokeDasharray={`${dashTotal}`}
                strokeDashoffset={cashOffset}
                strokeLinecap="round"
                className="drop-shadow-md transition-all duration-500 ease-out"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider">
                TOTAL
              </span>
              <span className="text-lg font-black text-gray-800">
                {totalAssets.toLocaleString()}원
              </span>
            </div>

            {/* Labels repositioned to the outer sides to avoid overlap */}
            {/* Stock Label */}
            <div className="absolute left-[-8%] top-[55%] flex flex-col items-center bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-blue-100/50 shadow-sm animate-in fade-in duration-700">
              <span className="text-[10px] font-bold text-[#004FFE]">주식</span>
              <span className="text-xs font-black text-[#004FFE]">
                {stockPercent}%
              </span>
            </div>

            {/* Cash Label */}
            <div className="absolute right-[-8%] top-[35%] flex flex-col items-center bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-blue-100/50 shadow-sm animate-in fade-in duration-700">
              <span className="text-[10px] font-bold text-[#6EA8FE]">현금</span>
              <span className="text-xs font-black text-[#6EA8FE]">
                {cashPercent}%
              </span>
            </div>
          </div>

          {/* Asset Breakdown Cards */}
          <div className="w-full mt-8 space-y-4">
            {/* Stock Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-[#D6E4F7] animate-in slide-in-from-bottom-2 duration-300">
              <div className="bg-[#004FFE] px-4 py-2 flex justify-center">
                <span className="text-sm font-bold text-white">
                  주식 {stockPercent}%
                </span>
              </div>
              <div className="border-t border-[#D6E4F7]"></div>
              <div className="p-4 flex justify-center">
                <span className="text-xl font-extrabold text-gray-700 tracking-tight">
                  {stockValue.toLocaleString()}원
                </span>
              </div>
            </div>

            {/* Cash Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-[#D6E4F7] animate-in slide-in-from-bottom-4 duration-300">
              <div className="bg-[#6EA8FE] px-4 py-2 flex justify-center">
                <span className="text-sm font-bold text-white">
                  현금 {cashPercent}%
                </span>
              </div>
              <div className="border-t border-[#D6E4F7]"></div>
              <div className="p-4 flex justify-center">
                <span className="text-xl font-extrabold text-gray-700 tracking-tight">
                  {cash.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>

          {/* Decorative hint */}
          <p className="mt-8 text-[11px] text-gray-400 font-medium text-center leading-relaxed">
            포트폴리오 비중을 조절하여
            <br />더 안정적인 투자를 시작해보세요!
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssetsContent;
