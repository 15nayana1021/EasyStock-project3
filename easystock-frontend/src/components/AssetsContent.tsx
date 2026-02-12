import React from "react";
import { PortfolioItem } from "../types";

interface AssetsContentProps {
  cash: number;
  portfolio: PortfolioItem[];
}

const AssetsContent: React.FC<AssetsContentProps> = ({ cash, portfolio }) => {
  // 1. 총 주식 평가금 계산
  const totalStockValue = portfolio.reduce((acc, item) => {
    // 현재가가 있으면 현재가, 없으면 평단가로 계산
    const price =
      typeof item.current_price === "number"
        ? item.current_price
        : item.average_price;
    return acc + price * item.quantity;
  }, 0);

  // 2. 총 자산 및 비율 계산
  const totalAsset = cash + totalStockValue;
  const stockRatio = totalAsset > 0 ? (totalStockValue / totalAsset) * 100 : 0;
  const cashRatio = totalAsset > 0 ? (cash / totalAsset) * 100 : 100;

  return (
    <div className="h-full overflow-y-auto pb-20 px-2">
      <h2 className="text-xl font-black text-center text-[#1E382F] mt-6 mb-8">
        나의 자산 현황
      </h2>

      {/* 1. 도넛 차트 섹션 */}
      <div className="relative w-64 h-64 mx-auto mb-8">
        {/* 도넛 그래프 (CSS conic-gradient 활용) */}
        <div
          className="w-full h-full rounded-full shadow-xl"
          style={{
            background: `conic-gradient(
              #4ADE80 0% ${stockRatio}%, 
              #2D8C69 ${stockRatio}% 100%
            )`,
          }}
        ></div>

        {/* 가운데 구멍 (흰색 원) */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#F4F8F6] rounded-full flex flex-col items-center justify-center shadow-inner">
          <span className="text-gray-400 text-xs font-bold mb-1">TOTAL</span>
          <span className="text-2xl font-black text-[#1E382F]">
            {totalAsset.toLocaleString()}원
          </span>
        </div>

        {/* 라벨 (주식) */}
        <div className="absolute top-10 left-0 bg-white px-3 py-1.5 rounded-xl shadow-md border border-gray-100">
          <p className="text-xs font-bold text-gray-400">주식</p>
          <p className="text-[#4ADE80] font-black">{Math.round(stockRatio)}%</p>
        </div>

        {/* 라벨 (현금) */}
        <div className="absolute bottom-10 right-0 bg-white px-3 py-1.5 rounded-xl shadow-md border border-gray-100">
          <p className="text-xs font-bold text-gray-400">현금</p>
          <p className="text-[#2D8C69] font-black">{Math.round(cashRatio)}%</p>
        </div>
      </div>

      {/* 2. 상세 자산 카드 */}
      <div className="space-y-4 px-2">
        {/* 주식 평가금 카드 */}
        <div className="bg-white p-6 rounded-[1.5rem] shadow-lg border border-gray-100 flex justify-between items-center">
          <span className="text-gray-400 font-bold">주식 평가금</span>
          <span className="text-2xl font-black text-[#1E382F]">
            {totalStockValue.toLocaleString()}원
          </span>
        </div>

        {/* 보유 현금 카드 */}
        <div className="bg-white p-6 rounded-[1.5rem] shadow-lg border border-gray-100 flex justify-between items-center">
          <span className="text-gray-400 font-bold">보유 현금</span>
          <span className="text-2xl font-black text-[#2D8C69]">
            {cash.toLocaleString()}원
          </span>
        </div>
      </div>

      {/* 하단 문구 */}
      <p className="text-center text-gray-400 text-xs mt-8 mb-4">
        포트폴리오 비중을 조절하여
        <br />더 안정적인 투자를 시작해보세요!
      </p>
    </div>
  );
};

export default AssetsContent;
