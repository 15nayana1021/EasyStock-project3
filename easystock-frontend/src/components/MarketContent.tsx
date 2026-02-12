
import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
import { StockData, WatchlistItem } from '../types';
import { marketIndices, allRankingStocks, MarketIndex, RankedStock } from '../data/mockData';
import StockDetail from './StockDetail';
import { fetchCompanies } from '../services/api';

interface MarketContentProps {
  watchlist: WatchlistItem[];
  onToggleWatchlist: (stock: StockData) => void;
  onBuy: (stock: StockData, price: number, qty: number) => void;
  onSell: (stock: StockData, price: number, qty: number) => void;
}

const MarketContent: React.FC<MarketContentProps> = ({ watchlist, onToggleWatchlist, onBuy, onSell }) => {
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [rankFilter, setRankFilter] = useState<'up' | 'down'>('up');
  const [category, setCategory] = useState('전체');
  const [showAllRanking, setShowAllRanking] = useState(false);
  
  // State for Ranking Stocks (Backend Data)
  const [rankingStocks, setRankingStocks] = useState<RankedStock[]>([]);

  // [백엔드 팀]: 기업 목록 조회
  // 이 useEffect는 백엔드에서 기업 데이터를 가져옵니다 (Lee 명세서: GET /api/companies).
  // 엔드포인트나 데이터 형식을 변경해야 한다면 `src/services/api.ts`를 확인하세요.
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const data = await fetchCompanies();
        
        // API StockData를 UI RankedStock 형식으로 매핑
        // [백엔드 팀]: 현재 API (Lee 명세서)는 '등락폭' 데이터를 제공하지 않습니다.
        // 따라서 changeValue를 0으로 기본 설정합니다. 가능하면 API에서 등락폭 데이터를 반환하도록 업데이트 부탁드립니다.
        const mappedData: RankedStock[] = data.map((stock) => ({
          ...stock,
          id: stock.id || Math.random(), // Ensure ID exists
          changeValue: 0, // 백엔드에서 아직 제공하지 않으므로 모의 값 사용
          changeText: "0.00%", // 모의 값
          category: stock.badge || "기타", // badge (sector)를 카테고리로 사용
          isUp: true
        }));

        // If backend returns empty (e.g., server down), fallback to mock data for demo
        if (mappedData.length > 0) {
          setRankingStocks(mappedData);
        } else {
            console.warn("[MarketContent] Backend returned empty list, using fallback mock data.");
            setRankingStocks(allRankingStocks);
        }
      } catch (error) {
        console.error("[MarketContent] Failed to load stocks", error);
        setRankingStocks(allRankingStocks); // Fallback
      }
    };
    loadCompanies();
  }, []);

  // 실시간 랭킹: 상승폭 클릭 시 높은 상승률 순, 하락폭 클릭 시 낮은 하락률(큰 폭의 하락) 순으로 12개 나열
  const filteredAndSortedRanking = useMemo(() => {
    // Use rankingStocks instead of allRankingStocks
    const list = [...rankingStocks].sort((a, b) => {
      if (rankFilter === 'up') {
        return b.changeValue - a.changeValue; // 상승폭 큰 순서
      } else {
        return a.changeValue - b.changeValue; // 하락폭 큰 순서 (음수 값이 더 작은 것부터)
      }
    });
    
    return showAllRanking ? list : list.slice(0, 5);
  }, [rankFilter, showAllRanking, rankingStocks]);

  // 분야별 랭킹: 랭킹 필터에 영향을 받지 않고 오직 이름순(가나다)으로 나열
  const currentCategoryStocks = useMemo(() => {
    let list = [...rankingStocks];
    
    if (category !== '전체') {
      list = list.filter(stock => stock.category === category);
    }
    
    return list.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [category, rankingStocks]);

  const handleStockClick = (stock: StockData) => {
      setSelectedStock(stock);
  };

  if (selectedStock) {
    const isLiked = watchlist.some(item => item.name === selectedStock.name);
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

  const categories = ['전체', '바이오', 'IT', '전자', '금융'];

  return (
    <div className="flex flex-col h-full bg-[#F4F8F6] rounded-t-[2.5rem] overflow-hidden animate-in fade-in duration-300">
      {/* Search Bar */}
      <div className="px-5 pt-6 pb-4">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="궁금한 종목을 검색해보세요!" 
            className="w-full bg-[#E9EEF3] border-none rounded-full py-3.5 pl-12 pr-4 text-sm font-bold text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#2D8C69]/20 transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pb-32">
        {/* Market Trends */}
        <section className="mb-8">
          <h2 className="text-base font-black text-gray-800 mb-4 tracking-tight">시장 동향</h2>
          <div className="grid grid-cols-3 gap-3">
            {marketIndices.map((index) => (
              <div key={index.name} className="bg-white p-3.5 rounded-2xl flex flex-col space-y-1 border border-white/50 shadow-sm transition-transform active:scale-95">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{index.name}</span>
                <span className="text-sm font-black text-gray-800 tracking-tighter">{index.value}</span>
                <div className={`flex items-center text-[10px] font-black ${index.isUp ? 'text-red-500' : 'text-blue-500'}`}>
                  {index.isUp ? '▲' : '▼'} {index.change}
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
              onClick={() => setRankFilter('up')}
              className={`px-4 py-1.5 rounded-full text-[11px] font-black transition-all ${rankFilter === 'up' ? 'bg-[#2D8C69] text-white shadow-md' : 'bg-gray-200/50 text-gray-400'}`}
            >
              상승폭
            </button>
            <button 
              onClick={() => setRankFilter('down')}
              className={`px-4 py-1.5 rounded-full text-[11px] font-black transition-all ${rankFilter === 'down' ? 'bg-[#2D8C69] text-white shadow-md' : 'bg-gray-200/50 text-gray-400'}`}
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
                    <span className="font-bold text-gray-800 text-sm tracking-tight">{stock.name}</span>
                    <span className="bg-[#E9EEF3] text-gray-400 text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none">가상</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-gray-800 tracking-tighter">{stock.price}</p>
                  <p className={`text-[11px] font-black flex items-center justify-end ${stock.isUp ? 'text-red-500' : 'text-blue-500'}`}>
                    {stock.isUp ? '▲' : '▼'} {stock.changeText}
                  </p>
                </div>
              </div>
            ))}
            
            <button 
              onClick={() => setShowAllRanking(!showAllRanking)}
              className="w-full py-3.5 bg-gray-100/50 hover:bg-gray-100 rounded-2xl flex items-center justify-center space-x-2 text-gray-500 font-bold text-xs transition-all active:scale-95"
            >
              {showAllRanking ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>{showAllRanking ? '접기' : '전체 ({rankingStocks.length}개)'}</span>
            </button>
          </div>
        </section>

        {/* Category Ranking Section */}
        <section className="mt-8">
          <h2 className="text-base font-black text-gray-800 mb-4 tracking-tight">분야별</h2>
          <div className="flex space-x-2 overflow-x-auto hide-scrollbar mb-4 pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-none px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                  category === cat ? 'bg-[#2D8C69] text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100'
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
                    <div className="w-8 h-8 bg-[#2D8C69] rounded-lg flex items-center justify-center text-white font-black text-xs">
                      {index + 1}
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-800 text-sm tracking-tight">{stock.name}</span>
                        <span className="bg-[#E9EEF3] text-gray-400 text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none">가상</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="text-sm font-black text-gray-800 tracking-tighter">{stock.price}</p>
                    <div className={`flex items-center text-[10px] font-black ${stock.isUp ? 'text-red-500' : 'text-blue-500'}`}>
                      {stock.isUp ? '▲' : '▼'} {stock.changeText}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-gray-300 text-xs font-bold">해당 조건에 맞는 데이터가 없습니다.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MarketContent;
