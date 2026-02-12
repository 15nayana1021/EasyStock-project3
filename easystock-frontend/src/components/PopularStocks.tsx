
import React from 'react';
import { TrendingUp, ChevronRight } from 'lucide-react';
import { popularStocks } from '../data/mockData';

const PopularStocks: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#E8F3EF] rounded-t-[2.5rem] border border-white/50 shadow-inner overflow-hidden">
      {/* Sticky Header inside component */}
      <div className="p-5 pb-2">
        <div className="flex items-center space-x-2 text-[#2D8C69]">
          <div className="bg-white p-1.5 rounded-xl shadow-sm">
            <TrendingUp size={20} />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">실시간 인기 종목</h2>
        </div>
        <p className="text-[11px] text-gray-500 font-medium mt-1.5 opacity-80 pl-1">지금 사람들이 가장 많이 보고 있는 종목</p>
      </div>

      {/* Internal Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 hide-scrollbar pb-32">
        <div className="flex flex-col space-y-3 mt-3">
          {popularStocks.map((stock) => {
            let badgeClass = "bg-gray-100 text-gray-400";
            if (stock.rank === 1) {
              badgeClass = "text-white shadow-[0_4px_10px_rgba(251,191,36,0.3),inset_0_-2px_4px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.4)] bg-gradient-to-br from-[#FCD34D] via-[#FBBF24] to-[#B45309]";
            } else if (stock.rank === 2) {
              badgeClass = "text-white shadow-[0_4px_10px_rgba(192,192,192,0.3),inset_0_-2px_4px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.4)] bg-gradient-to-br from-[#E5E7EB] via-[#C0C0C0] to-[#6B7280]";
            } else if (stock.rank === 3) {
              badgeClass = "text-white shadow-[0_4px_10px_rgba(205,127,50,0.3),inset_0_-2px_4px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.4)] bg-gradient-to-br from-[#E8AC73] via-[#CD7F32] to-[#78350F]";
            }

            return (
              <div 
                key={stock.rank}
                className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-green-50/50 hover:border-green-200 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-b-2 border-black/5 ${badgeClass}`}>
                    {stock.rank}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">{stock.name}</h3>
                    <p className="text-[11px] text-gray-400 font-medium">{stock.price}</p>
                  </div>
                </div>
                <div className={`font-bold text-sm ${stock.isUp ? 'text-red-500' : 'text-blue-500'}`}>
                  {stock.change}
                </div>
              </div>
            );
          })}
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
