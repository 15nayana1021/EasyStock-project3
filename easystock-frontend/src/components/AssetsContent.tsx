import React from "react";
import { PortfolioItem } from "../types";

interface AssetsContentProps {
  cash: number;
  portfolio: PortfolioItem[];
}

const AssetsContent: React.FC<AssetsContentProps> = ({ cash, portfolio }) => {
  // 1. 데이터 계산
  const totalStockValue = portfolio.reduce((acc, item) => {
    // 현재가가 없으면 평단가로 계산 (안전장치)
    const price =
      typeof item.current_price === "number"
        ? item.current_price
        : item.average_price;
    // item.quantity (숫자)를 사용
    return acc + price * item.quantity;
  }, 0);

  const totalAsset = cash + totalStockValue;

  // 비중 계산
  const stockRatio =
    totalAsset > 0 ? Math.round((totalStockValue / totalAsset) * 100) : 0;
  const cashRatio = totalAsset > 0 ? 100 - stockRatio : 100;

  // 2. 디자인 및 차트 구현
  const dashTotal = 251.2;
  const cashOffset = (stockRatio / 100) * dashTotal;

  return (
    <div className="flex flex-col h-full bg-[#E8F3EF] rounded-t-[2.5rem] border border-white/50 shadow-inner overflow-hidden">
      {/* 헤더 디자인 (1번 파일 스타일) */}
      <div className="p-5 pb-3">
        <div className="flex justify-center">
          <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">
            나의 자산 현황
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 hide-scrollbar pb-32">
        <div className="flex flex-col items-center mt-4">
          {/* 도넛 차트 구현 (1번 파일의 SVG 방식) */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full transform -rotate-90"
            >
              {/* 현금 영역 (연두색) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#CDE79D"
                strokeWidth="14"
                strokeDasharray={`${dashTotal}`}
                strokeDashoffset="0"
              />
              {/* 주식 영역 (진한 초록색) - 애니메이션 효과 포함 */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#2D8C69"
                strokeWidth="14"
                strokeDasharray={`${dashTotal}`}
                strokeDashoffset={cashOffset}
                strokeLinecap="round"
                className="drop-shadow-md transition-all duration-500 ease-out"
              />
            </svg>

            {/* 가운데 총 자산 표시 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider">
                TOTAL
              </span>
              <span className="text-lg font-black text-gray-800">
                {totalAsset.toLocaleString()}원
              </span>
            </div>

            {/* 좌우 둥둥 떠있는 라벨 (1번 파일 디자인) */}
            <div className="absolute left-[-5%] top-[55%] flex flex-col items-center bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-green-100/50 shadow-sm animate-in fade-in duration-700">
              <span className="text-[10px] font-bold text-[#2D8C69]">주식</span>
              <span className="text-xs font-black text-[#2D8C69]">
                {stockRatio}%
              </span>
            </div>

            <div className="absolute right-[-5%] top-[35%] flex flex-col items-center bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-lime-100/50 shadow-sm animate-in fade-in duration-700">
              <span className="text-[10px] font-bold text-[#8DBA9C]">현금</span>
              <span className="text-xs font-black text-[#8DBA9C]">
                {cashRatio}%
              </span>
            </div>
          </div>

          {/* 하단 카드 디자인 (1번 파일의 그라데이션 헤더 스타일) */}
          <div className="w-full mt-8 space-y-4">
            {/* 주식 카드 */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-green-50/50 animate-in slide-in-from-bottom-2 duration-300">
              <div className="bg-gradient-to-r from-[#2D8C69] to-[#68B297] px-4 py-2 flex justify-center">
                <span className="text-sm font-bold text-white">
                  주식 {stockRatio}%
                </span>
              </div>
              <div className="p-4 flex justify-center">
                <span className="text-xl font-extrabold text-gray-700 tracking-tight">
                  {totalStockValue.toLocaleString()}원
                </span>
              </div>
            </div>

            {/* 현금 카드 */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-green-50/50 animate-in slide-in-from-bottom-4 duration-300">
              <div className="bg-gradient-to-r from-[#8DBA9C] to-[#CDE79D] px-4 py-2 flex justify-center">
                <span className="text-sm font-bold text-white">
                  현금 {cashRatio}%
                </span>
              </div>
              <div className="p-4 flex justify-center">
                <span className="text-xl font-extrabold text-gray-700 tracking-tight">
                  {cash.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>

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
