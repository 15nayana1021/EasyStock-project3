import React, { useState, useEffect } from "react";
import { TrendingUp, ChevronRight } from "lucide-react";

// API 주소
const API_BASE_URL = "http://localhost:8000";

interface HotStock {
  rank: number;
  name: string;
  price: string;
  change: string;
  isUp: boolean;
}

const PopularStocks: React.FC = () => {
  const [stocks, setStocks] = useState<HotStock[]>([]);

  // 백엔드에서 실시간 랭킹 가져오기
  useEffect(() => {
    const fetchHotRanking = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/ranking/hot`);
        if (!response.ok) throw new Error("랭킹 불러오기 실패");

        const data = await response.json();

        // 데이터가 어떻게 오는지 터미널 콘솔에서 직접 확인해보기
        console.log("백엔드에서 온 데이터:", data);

        const mappedData = data.map((item: any) => {
          // 값이 없을 경우를 대비한 안전장치 마련
          const priceValue = item.current_price || item.price || 0;
          const changeValue = item.change_rate || 0;
          const stockName = item.name || item.ticker || "정보 없음";

          return {
            rank: item.rank || 0,
            name: stockName,
            price: `${Number(priceValue).toLocaleString()}원`,
            change: `${changeValue > 0 ? "+" : ""}${changeValue.toFixed(2)}%`,
            isUp: changeValue >= 0,
          };
        });

        setStocks(mappedData);
      } catch (error) {
        console.error("인기 종목 로딩 실패:", error);
      }
    };

    fetchHotRanking();
    // 5초마다 랭킹 갱신 (실시간 느낌)
    const interval = setInterval(fetchHotRanking, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#E8F3EF] rounded-t-[2.5rem] border border-white/50 shadow-inner overflow-hidden">
      {/* 헤더 디자인 */}
      <div className="p-5 pb-2">
        <div className="flex items-center space-x-2 text-[#2D8C69]">
          <div className="bg-white p-1.5 rounded-xl shadow-sm">
            <TrendingUp size={20} />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            실시간 인기 종목
          </h2>
        </div>
        <p className="text-[11px] text-gray-500 font-medium mt-1.5 opacity-80 pl-1">
          지금 사람들이 가장 많이 보고 있는 종목
        </p>
      </div>

      {/* 리스트 영역 */}
      <div className="flex-1 overflow-y-auto px-5 hide-scrollbar pb-32">
        <div className="flex flex-col space-y-3 mt-3">
          {stocks.length > 0 ? (
            stocks.map((stock) => {
              let badgeClass = "bg-gray-100 text-gray-400";
              if (stock.rank === 1) {
                badgeClass =
                  "text-white shadow-md bg-gradient-to-br from-[#FCD34D] via-[#FBBF24] to-[#B45309]";
              } else if (stock.rank === 2) {
                badgeClass =
                  "text-white shadow-md bg-gradient-to-br from-[#E5E7EB] via-[#C0C0C0] to-[#6B7280]";
              } else if (stock.rank === 3) {
                badgeClass =
                  "text-white shadow-md bg-gradient-to-br from-[#E8AC73] via-[#CD7F32] to-[#78350F]";
              }

              return (
                <div
                  key={stock.rank}
                  className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-green-50/50 hover:border-green-200 transition-colors animate-in slide-in-from-bottom-2"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-b-2 border-black/5 ${badgeClass}`}
                    >
                      {stock.rank}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">
                        {stock.name}
                      </h3>
                      <p className="text-[11px] text-gray-400 font-medium">
                        {stock.price}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`font-bold text-sm ${stock.isUp ? "text-red-500" : "text-blue-500"}`}
                  >
                    {stock.change}
                  </div>
                </div>
              );
            })
          ) : (
            // 데이터 로딩 중이거나 없을 때 표시
            <div className="text-center py-10 text-gray-400 text-xs font-bold">
              실시간 랭킹을 불러오는 중입니다...
            </div>
          )}

          <button className="mt-1 w-full py-4 bg-white/70 hover:bg-white transition-all rounded-2xl flex items-center justify-center space-x-1 text-[#2D8C69] font-bold text-sm shadow-sm border border-white">
            <span>전체 순위 보기</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopularStocks;
