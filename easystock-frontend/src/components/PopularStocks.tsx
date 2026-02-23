import React, { useState, useEffect } from "react";
import { TrendingUp, ChevronRight, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../services/api";

// API 주소 (사용자 로직 유지)
const API_BASE_URL = BASE_URL;
interface HotStock {
  rank: number;
  name: string;
  price: string;
  change: string;
  isUp: boolean;
  symbol: string;
}

const PopularStocks: React.FC = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<HotStock[]>([]);
  const [visibleCount, setVisibleCount] = useState(5);

  const handleShowMore = () => setVisibleCount(stocks.length);
  const handleShowLess = () => setVisibleCount(5);

  const visibleStocks = stocks.slice(0, visibleCount);
  const hasMore = stocks.length > visibleCount;

  useEffect(() => {
    const fetchHotRanking = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/ranking/hot`);
        if (!response.ok) throw new Error("랭킹 불러오기 실패");

        const data = await response.json();
        const mappedData = data.map((item: any) => {
          const priceValue = item.current_price || item.price || 0;
          const changeValue = item.change_rate || 0;
          const stockName = item.name || item.ticker || "정보 없음";

          return {
            rank: item.rank || 0,
            name: stockName,
            price: `${Number(priceValue).toLocaleString()}원`,
            change: `${changeValue > 0 ? "+" : ""}${changeValue.toFixed(2)}%`,
            isUp: changeValue >= 0,
            symbol: item.ticker || item.name || "",
          };
        });

        setStocks(mappedData);
      } catch (error) {
        console.error("인기 종목 로딩 실패:", error);
      }
    };

    fetchHotRanking();
    const interval = setInterval(fetchHotRanking, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#CFE3FA] rounded-t-[2.5rem] border border-white/50 shadow-inner overflow-hidden">
      {/* Internal Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 hide-scrollbar pb-32">
        <div className="flex flex-col space-y-3 pt-5">
          {/* 헤더 섹션 디자인 변경 (2번 파일 적용) */}
          <div className="text-center mb-2 px-5">
            <h2 className="text-xl font-extrabold tracking-tight text-[#1A334E]">
              실시간 인기 종목
            </h2>
            <p className="text-[11px] text-[#A0ABBA] font-medium mt-1.5">
              지금 사람들이 가장 많이 보고 있는 종목
            </p>
          </div>

          {stocks.length > 0 ? (
            visibleStocks.map((stock) => {
              let badgeClass = "bg-[#E9EEF3] text-[#A0ABBA]";

              if (stock.rank === 1) {
                badgeClass =
                  "text-white shadow-[0_4px_10px_rgba(251,191,36,0.3),inset_0_-2px_4px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.4)] bg-gradient-to-br from-[#FCD34D] via-[#FBBF24] to-[#B45309]";
              } else if (stock.rank === 2) {
                badgeClass =
                  "text-white shadow-[0_4px_10px_rgba(192,192,192,0.3),inset_0_-2px_4px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.4)] bg-gradient-to-br from-[#E5E7EB] via-[#C0C0C0] to-[#6B7280]";
              } else if (stock.rank === 3) {
                badgeClass =
                  "text-white shadow-[0_4px_10px_rgba(205,127,50,0.3),inset_0_-2px_4px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.4)] bg-gradient-to-br from-[#E8AC73] via-[#CD7F32] to-[#78350F]";
              }

              return (
                <div
                  key={stock.rank}
                  onClick={() => navigate(`/stock/${stock.symbol}`)}
                  className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-[#CFE3FA]/50 hover:border-[#CFE3FA] transition-colors cursor-pointer animate-in slide-in-from-bottom-2"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-b-2 border-black/5 ${badgeClass}`}
                    >
                      {stock.rank}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1A334E] text-sm">
                        {stock.name}
                      </h3>
                      <p className="text-[11px] text-[#A0ABBA] font-medium">
                        {stock.price}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`font-bold text-sm ${stock.isUp ? "text-[#E53935]" : "text-[#1E88E5]"}`}
                  >
                    {stock.change}
                  </div>
                </div>
              );
            })
          ) : (
            // 데이터 로딩 중 표시 (사용자 로직 유지)
            <div className="text-center py-10 text-[#A0ABBA] text-xs font-bold">
              실시간 랭킹을 불러오는 중입니다...
            </div>
          )}

          {/* 더보기 & 접기 버튼 (사용자님 투버튼 로직 + 팀원 블루 디자인) */}
          <div className="flex gap-2 mt-1">
            {hasMore && (
              <button
                onClick={handleShowMore}
                className="flex-1 py-4 bg-white/70 hover:bg-white transition-all rounded-2xl flex items-center justify-center space-x-1 text-[#004FFE] font-bold text-sm shadow-sm border border-white"
              >
                <span>전체 순위 보기</span>
                <ChevronRight size={16} />
              </button>
            )}

            {visibleCount > 5 && (
              <button
                onClick={handleShowLess}
                className="flex-1 py-4 bg-white/70 hover:bg-white transition-all rounded-2xl flex items-center justify-center space-x-1 text-[#004FFE] font-bold text-sm shadow-sm border border-white"
              >
                <span>접기</span>
                <ChevronUp size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopularStocks;
