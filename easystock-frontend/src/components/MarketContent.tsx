import React, { useState, useMemo, useEffect } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { StockData, WatchlistItem } from "../types";
import { marketIndices, allRankingStocks } from "../data/mockData";
import StockDetail from "./StockDetail";
import { fetchCompanies } from "../services/api";

interface RankedStock extends StockData {
  change_rate: number;
  changeText: string;
  isUp: boolean;
  category: string;
  volume: number;
}

interface MarketContentProps {
  watchlist: WatchlistItem[];
  onToggleWatchlist: (stock: StockData) => void;
  onBuy: (stock: StockData, price: number, qty: number) => void;
  onSell: (stock: StockData, price: number, qty: number) => void;
  virtualDate: string;
  activeNews: any[];
  cash?: number;
  portfolio?: any[];
}

const MarketContent: React.FC<MarketContentProps> = ({
  watchlist,
  onToggleWatchlist,
  onBuy,
  onSell,
  virtualDate,
  activeNews,
  cash,
  portfolio,
}) => {
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [rankFilter, setRankFilter] = useState<"up" | "down" | "volume">("up");
  const [category, setCategory] = useState("전체");
  const [showAllRanking, setShowAllRanking] = useState(false);

  const [rankingStocks, setRankingStocks] = useState<RankedStock[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // 검색 필터 로직
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return rankingStocks.filter((stock) =>
      stock.name.includes(searchQuery.trim()),
    );
  }, [searchQuery, rankingStocks]);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const data = await fetchCompanies();

        const categoryMap: Record<string, string> = {
          삼송전자: "전자",
          에이펙스테크: "전자",
          상은테크놀로지: "바이오",
          재웅시스템: "전자",
          마이크로하드: "IT",
          넥스트데이터: "IT",
          선우솔루션: "금융",
          퀀텀디지털: "금융",
          진호랩: "바이오",
          소현컴퍼니: "IT",
          인사이트애널리틱스: "바이오",
          예진캐피탈: "금융",
        };

        const mappedData: RankedStock[] = data.map((stock: any) => {
          const rateString = (stock.change || "0").replace(/[^0-9.-]/g, "");
          const rate = parseFloat(rateString) || 0;

          return {
            ...stock,
            id: stock.id || Math.random(),
            change_rate: rate,
            changeText: `${Math.abs(rate).toFixed(2)}%`,
            isUp: stock.isUp !== undefined ? stock.isUp : rate >= 0,
            category: categoryMap[stock.name] || "IT",
            volume: stock.volume || 0,
          };
        });

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

    const interval = setInterval(loadCompanies, 3000);
    return () => clearInterval(interval);
  }, []);

  // 실시간 랭킹 정렬 로직
  const filteredAndSortedRanking = useMemo(() => {
    const list = [...rankingStocks];
    list.sort((a, b) => {
      if (rankFilter === "up") {
        return b.change_rate - a.change_rate;
      } else if (rankFilter === "down") {
        return a.change_rate - b.change_rate;
      } else {
        return (b.volume || 0) - (a.volume || 0);
      }
    });
    return showAllRanking ? list : list.slice(0, 5);
  }, [rankFilter, showAllRanking, rankingStocks]);

  // 분야별 랭킹 로직
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

  // 주식 상세 페이지 연결
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
        activeNews={activeNews}
        cash={cash}
        portfolio={portfolio}
      />
    );
  }

  const categories = ["전체", "바이오", "IT", "전자", "금융"];

  return (
    <div className="flex flex-col h-full bg-[#F0F4FA] rounded-t-[2.5rem] overflow-hidden animate-in fade-in duration-300">
      {/* Search Input */}
      <div className="px-5 pt-6 pb-4">
        <div className="relative group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="궁금한 종목을 검색해보세요!"
            className="w-full bg-white border border-[#CFE3FA] rounded-full py-3.5 pl-12 pr-4 text-sm font-bold text-[#1A334E] placeholder-[#A0ABBA] focus:outline-none focus:border-[#004FFE] focus:ring-4 focus:ring-[#004FFE]/10 transition-all shadow-sm"
          />
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 mt-[9px] text-[#A0ABBA] group-focus-within:text-[#004FFE] transition-colors"
            size={20}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pb-32">
        {searchQuery.trim() !== "" ? (
          /* --- 검색 결과 화면 --- */
          <section className="mt-2 animate-in fade-in">
            <h2 className="text-base font-black text-[#1A334E] mb-4 tracking-tight">
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
                      <div className="w-8 h-8 bg-[#F0F4FA] rounded-full flex items-center justify-center text-[#A0ABBA] font-black text-xs">
                        <Search size={14} />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[#1A334E] text-sm tracking-tight">
                          {stock.name}
                        </span>
                        {/* 실제/가상 뱃지 로직 완벽 적용 (블루테마 버전) */}
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none ${
                            ["삼송전자", "마이크로하드"].includes(stock.name)
                              ? "bg-[#004FFE]/10 text-[#004FFE]" // 실제 기업
                              : "bg-[#E9EEF3] text-[#A0ABBA]" // 가상 기업
                          }`}
                        >
                          {["삼송전자", "마이크로하드"].includes(stock.name)
                            ? "실제"
                            : "가상"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-sm font-black text-[#1A334E] tracking-tighter">
                        {stock.price}
                      </p>
                      <div
                        className={`flex items-center text-[10px] font-black ${stock.isUp ? "text-[#E53935]" : "text-[#1E88E5]"}`}
                      >
                        {stock.isUp ? "▲" : "▼"} {stock.changeText}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-[#A0ABBA] text-xs font-bold">
                  '{searchQuery}'에 대한 검색 결과가 없습니다.
                </div>
              )}
            </div>
          </section>
        ) : (
          <>
            {/* Market Trends */}
            <section className="mb-8">
              <h2 className="text-base font-black text-[#1A334E] mb-4 tracking-tight">
                시장 동향
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {marketIndices.map((index) => (
                  <div
                    key={index.name}
                    className="bg-white p-3.5 rounded-2xl flex flex-col space-y-1 border border-[#CFE3FA]/50 shadow-sm transition-transform active:scale-95 cursor-default"
                  >
                    <span className="text-[10px] font-black text-[#A0ABBA] uppercase tracking-tighter">
                      {index.name}
                    </span>
                    <span className="text-sm font-black text-[#1A334E] tracking-tighter">
                      {index.value}
                    </span>
                    <div
                      className={`flex items-center text-[10px] font-black ${index.isUp ? "text-[#E53935]" : "text-[#1E88E5]"}`}
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
                <h2 className="text-base font-black text-[#1A334E] flex items-center tracking-tight">
                  실시간 랭킹
                </h2>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setRankFilter("up")}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-black tracking-tight transition-all shadow-sm ${
                    rankFilter === "up"
                      ? "bg-[#1A334E] text-white"
                      : "bg-white text-[#A0ABBA] border border-[#E9EEF3]"
                  }`}
                >
                  상승
                </button>
                <button
                  onClick={() => setRankFilter("down")}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-black tracking-tight transition-all shadow-sm ${
                    rankFilter === "down"
                      ? "bg-[#1A334E] text-white"
                      : "bg-white text-[#A0ABBA] border border-[#E9EEF3]"
                  }`}
                >
                  하락
                </button>
                <button
                  onClick={() => setRankFilter("volume")}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-black tracking-tight transition-all shadow-sm ${
                    rankFilter === "volume"
                      ? "bg-[#1A334E] text-white"
                      : "bg-white text-[#A0ABBA] border border-[#E9EEF3]"
                  }`}
                >
                  거래량
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
                      {/* 순위 숫자 디자인 변경됨 */}
                      <div className="w-8 h-8 bg-[#004FFE]/10 rounded-xl flex items-center justify-center text-[#004FFE] font-black text-xs">
                        {index + 1}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[#1A334E] text-sm tracking-tight">
                          {stock.name}
                        </span>
                        {/* 실제/가상 뱃지 로직 완벽 적용 */}
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none ${
                            ["삼송전자", "마이크로하드"].includes(stock.name)
                              ? "bg-[#004FFE]/10 text-[#004FFE]"
                              : "bg-[#E9EEF3] text-[#A0ABBA]"
                          }`}
                        >
                          {["삼송전자", "마이크로하드"].includes(stock.name)
                            ? "실제"
                            : "가상"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {/* 현재 가격은 항상 보여줍니다. */}
                      <p className="text-sm font-black text-[#1A334E] tracking-tighter">
                        {stock.price}
                      </p>
                      {rankFilter !== "volume" && (
                        <p
                          className={`text-[11px] font-black flex items-center justify-end mt-0.5 ${stock.isUp ? "text-[#E53935]" : "text-[#1E88E5]"}`}
                        >
                          {stock.isUp ? "▲" : "▼"} {stock.changeText}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setShowAllRanking(!showAllRanking)}
                  className="w-full py-3.5 bg-[#F0F4FA] hover:bg-[#E4EDF7] rounded-2xl flex items-center justify-center space-x-2 text-[#A0ABBA] hover:text-[#004FFE] font-bold text-xs transition-all active:scale-95"
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
              <h2 className="text-base font-black text-[#1A334E] mb-4 tracking-tight">
                분야별
              </h2>

              <div className="flex space-x-2 overflow-x-auto hide-scrollbar mb-4 pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex-none px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                      category === cat
                        ? "bg-[#004FFE] text-white shadow-md shadow-[#004FFE]/20"
                        : "bg-white text-[#A0ABBA] border border-[#CFE3FA]"
                    }`}
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
                        <div className="w-8 h-8 bg-[#004FFE]/10 rounded-xl flex items-center justify-center text-[#004FFE] font-black text-xs">
                          {index + 1}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#1A334E] text-sm tracking-tight">
                            {stock.name}
                          </span>
                          {/* 실제/가상 뱃지 로직 완벽 적용 */}
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none ${
                              ["삼송전자", "마이크로하드"].includes(stock.name)
                                ? "bg-[#004FFE]/10 text-[#004FFE]"
                                : "bg-[#E9EEF3] text-[#A0ABBA]"
                            }`}
                          >
                            {["삼송전자", "마이크로하드"].includes(stock.name)
                              ? "실제"
                              : "가상"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="text-sm font-black text-[#1A334E] tracking-tighter">
                          {stock.price}
                        </p>
                        <div
                          className={`flex items-center text-[10px] font-black ${stock.isUp ? "text-[#E53935]" : "text-[#1E88E5]"}`}
                        >
                          {stock.isUp ? "▲" : "▼"} {stock.changeText}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-[#A0ABBA] text-xs font-bold">
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
