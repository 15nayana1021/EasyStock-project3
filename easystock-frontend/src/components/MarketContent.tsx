import React, { useState, useMemo, useEffect } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
// import { useNavigate } from 'react-router-dom';
import { StockData, WatchlistItem } from "../types";
import { marketIndices, allRankingStocks, MarketIndex } from "../data/mockData";
import StockDetail from "./StockDetail";
import { fetchCompanies } from "../services/api";

interface RankedStock extends StockData {
  change_rate: number;
  changeText: string;
  isUp: boolean;
  category: string;
}

interface MarketContentProps {
  watchlist: WatchlistItem[];
  onToggleWatchlist: (stock: StockData) => void;
  onBuy: (stock: StockData, price: number, qty: number) => void;
  onSell: (stock: StockData, price: number, qty: number) => void;
  virtualDate: string;
}

const MarketContent: React.FC<MarketContentProps> = ({
  watchlist,
  onToggleWatchlist,
  onBuy,
  onSell,
  virtualDate,
}) => {
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [rankFilter, setRankFilter] = useState<"up" | "down">("up");
  const [category, setCategory] = useState("전체");
  const [showAllRanking, setShowAllRanking] = useState(false);

  // State for Ranking Stocks (Backend Data)
  const [rankingStocks, setRankingStocks] = useState<RankedStock[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // 검색어에 맞는 주식만 걸러내는 필터 채망
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return rankingStocks.filter((stock) =>
      stock.name.includes(searchQuery.trim()),
    );
  }, [searchQuery, rankingStocks]);

  // [백엔드 팀]: 기업 목록 조회
  // 이 useEffect는 백엔드에서 기업 데이터를 가져옵니다 (Lee 명세서: GET /api/companies).
  // 엔드포인트나 데이터 형식을 변경해야 한다면 `src/services/api.ts`를 확인하세요.
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const data = await fetchCompanies();

        // API 데이터를 UI 형식으로 매핑
        const mappedData: RankedStock[] = data.map((stock: any) => {
          // 백엔드에서 온 change_rate (없으면 0)
          const rate = stock.change_rate || 0;

          return {
            ...stock,
            id: stock.id || Math.random(),

            // 진짜 데이터 연결
            change_rate: rate,
            changeText: `${Math.abs(rate).toFixed(2)}%`,
            isUp: rate >= 0,

            category: stock.badge || "기타",
          };
        });

        // 데이터가 있으면 적용, 없으면 데모 데이터(allRankingStocks) 사용
        if (mappedData.length > 0) {
          setRankingStocks(mappedData);
        } else {
          console.warn(
            "[MarketContent] 데이터가 비어있어 데모 데이터를 사용합니다.",
          );
          setRankingStocks(allRankingStocks);
        }
      } catch (error) {
        console.error("[MarketContent] 주식 목록 로딩 실패", error);
        setRankingStocks([]);
      }
    };
    loadCompanies();
  }, []);

  // 2. 실시간 랭킹 정렬 로직 (상승폭/하락폭)
  const filteredAndSortedRanking = useMemo(() => {
    const list = [...rankingStocks];

    list.sort((a, b) => {
      if (rankFilter === "up") {
        // 상승폭: 등락률이 높은 순서대로 (내림차순)
        return b.change_rate - a.change_rate;
      } else {
        // 하락폭: 등락률이 낮은(마이너스가 큰) 순서대로 (오름차순)
        return a.change_rate - b.change_rate;
      }
    });

    return showAllRanking ? list : list.slice(0, 5);
  }, [rankFilter, showAllRanking, rankingStocks]);

  // 분야별 랭킹: 랭킹 필터에 영향을 받지 않고 오직 이름순(가나다)으로 나열
  const currentCategoryStocks = useMemo(() => {
    let list = [...rankingStocks];

    if (category !== "전체") {
      list = list.filter((stock) => stock.category === category);
    }

    return list.sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [category, rankingStocks]);

  const handleStockClick = (stock: StockData) => {
    setSelectedStock(stock);
  };

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

  const categories = ["전체", "바이오", "IT", "전자", "금융"];

  return (
    <div className="flex flex-col h-full bg-[#F4F8F6] rounded-t-[2.5rem] overflow-hidden animate-in fade-in duration-300">
      <div className="px-5 pt-6 pb-4">
        <div className="relative group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="궁금한 종목을 검색해보세요!"
            className="w-full bg-[#E9EEF3] border-none rounded-full py-3.5 pl-12 pr-4 text-sm font-bold text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#2D8C69]/20 transition-all"
          />
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 mt-[9px] text-gray-400"
            size={20}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pb-32">
        {searchQuery.trim() !== "" ? (
          /* --- 검색 결과 화면 --- */
          <section className="mt-2 animate-in fade-in">
            <h2 className="text-base font-black text-gray-800 mb-4 tracking-tight">
              검색 결과
            </h2>
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-white space-y-6">
              {searchResults.length > 0 ? (
                searchResults.map((stock) => (
                  <div
                    key={stock.id}
                    onClick={() => handleStockClick(stock)}
                    className="flex items-center justify-between cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-black text-xs">
                        <Search size={14} />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-800 text-sm tracking-tight">
                          {stock.name}
                        </span>
                        <span className="bg-[#E9EEF3] text-gray-400 text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none">
                          가상
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-sm font-black text-gray-800 tracking-tighter">
                        {stock.price}
                      </p>
                      <div
                        className={`flex items-center text-[10px] font-black ${stock.isUp ? "text-red-500" : "text-blue-500"}`}
                      >
                        {stock.isUp ? "▲" : "▼"} {stock.changeText}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-gray-400 text-xs font-bold">
                  '{searchQuery}'에 대한 검색 결과가 없습니다.
                </div>
              )}
            </div>
          </section>
        ) : (
          <>
            {/* Market Trends */}
            <section className="mb-8">
              <h2 className="text-base font-black text-gray-800 mb-4 tracking-tight">
                시장 동향
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {marketIndices.map((index) => (
                  <div
                    key={index.name}
                    className="bg-white p-3.5 rounded-2xl flex flex-col space-y-1 border border-white/50 shadow-sm transition-transform active:scale-95"
                  >
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                      {index.name}
                    </span>
                    <span className="text-sm font-black text-gray-800 tracking-tighter">
                      {index.value}
                    </span>
                    <div
                      className={`flex items-center text-[10px] font-black ${index.isUp ? "text-red-500" : "text-blue-500"}`}
                    >
                      {index.isUp ? "▲" : "▼"} {index.change}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Real-time Ranking Section */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black text-gray-800 flex items-center tracking-tight">
                  실시간 랭킹
                </h2>
              </div>
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setRankFilter("up")}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-black transition-all ${rankFilter === "up" ? "bg-[#2D8C69] text-white shadow-md" : "bg-gray-200/50 text-gray-400"}`}
                >
                  상승폭
                </button>
                <button
                  onClick={() => setRankFilter("down")}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-black transition-all ${rankFilter === "down" ? "bg-[#2D8C69] text-white shadow-md" : "bg-gray-200/50 text-gray-400"}`}
                >
                  하락폭
                </button>
              </div>
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-white space-y-6 transition-all duration-300">
                {filteredAndSortedRanking.map((stock, index) => (
                  <div
                    key={stock.id}
                    onClick={() => handleStockClick(stock)}
                    className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-300 cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-[#2D8C69] rounded-lg flex items-center justify-center text-white font-black text-xs shadow-sm">
                        {index + 1}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-800 text-sm tracking-tight">
                          {stock.name}
                        </span>
                        <span className="bg-[#E9EEF3] text-gray-400 text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none">
                          가상
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-gray-800 tracking-tighter">
                        {stock.price}
                      </p>
                      <p
                        className={`text-[11px] font-black flex items-center justify-end ${stock.isUp ? "text-red-500" : "text-blue-500"}`}
                      >
                        {stock.isUp ? "▲" : "▼"} {stock.changeText}
                      </p>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setShowAllRanking(!showAllRanking)}
                  className="w-full py-3.5 bg-gray-100/50 hover:bg-gray-100 rounded-2xl flex items-center justify-center space-x-2 text-gray-500 font-bold text-xs transition-all active:scale-95"
                >
                  {showAllRanking ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                  <span>
                    {showAllRanking
                      ? "접기"
                      : `전체 (${rankingStocks.length}개)`}
                  </span>
                </button>
              </div>
            </section>

            {/* Category Ranking Section */}
            <section className="mt-8">
              <h2 className="text-base font-black text-gray-800 mb-4 tracking-tight">
                분야별
              </h2>
              <div className="flex space-x-2 overflow-x-auto hide-scrollbar mb-4 pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex-none px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${category === cat ? "bg-[#2D8C69] text-white shadow-md" : "bg-white text-gray-400 border border-gray-100"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-white space-y-6 min-h-[150px]">
                {currentCategoryStocks.length > 0 ? (
                  currentCategoryStocks.map((stock, index) => (
                    <div
                      key={stock.id}
                      onClick={() => handleStockClick(stock)}
                      className="flex items-center justify-between animate-in fade-in duration-300 cursor-pointer active:scale-[0.98]"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-[#2D8C69] rounded-lg flex items-center justify-center text-white font-black text-xs">
                          {index + 1}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-gray-800 text-sm tracking-tight">
                            {stock.name}
                          </span>
                          <span className="bg-[#E9EEF3] text-gray-400 text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none">
                            가상
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="text-sm font-black text-gray-800 tracking-tighter">
                          {stock.price}
                        </p>
                        <div
                          className={`flex items-center text-[10px] font-black ${stock.isUp ? "text-red-500" : "text-blue-500"}`}
                        >
                          {stock.isUp ? "▲" : "▼"} {stock.changeText}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-gray-300 text-xs font-bold">
                    해당 조건에 맞는 데이터가 없습니다.
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default MarketContent;
