
import React from 'react';
import { TrendingUp, ChevronRight } from 'lucide-react';

interface RankUser {
  rank: number;
  name: string;
  level: number;
  amount: string;
  profit: string;
}

const rankingData: RankUser[] = [
  { rank: 1, name: '김정수', level: 15, amount: '364,200,000원', profit: '+1,200%' },
  { rank: 2, name: '박영희', level: 10, amount: '840,420,000원', profit: '+950%' },
  { rank: 3, name: '최민수', level: 8, amount: '192,400,000원', profit: '+880%' },
  { rank: 4, name: '정다운', level: 7, amount: '120,000,000원', profit: '+420%' },
  { rank: 5, name: '이지성', level: 5, amount: '248,355원', profit: '+5.12%' },
];

const RankingContent: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#E8F3EF] rounded-t-[2.5rem] border border-white/50 shadow-inner overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-2">
        <div className="flex items-center space-x-2 text-[#2D8C69]">
          <TrendingUp size={22} strokeWidth={3} />
          <h2 className="text-xl font-extrabold tracking-tight text-gray-800">랭킹</h2>
        </div>
        <p className="text-[11px] text-gray-500 font-bold mt-1.5 opacity-80 pl-1">
          지금 사람들이 가장 많이 따라하고 있는 투자 고수
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 hide-scrollbar pb-32">
        {/* My Rank Card */}
        <div className="relative mt-2 mb-6">
          <div className="bg-[#2D8C69] rounded-[2rem] p-5 flex items-center justify-between shadow-lg shadow-green-900/10">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center text-white font-black text-lg">
                12
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-white/70 font-bold">나의 통합 수익률</span>
                <span className="text-lg font-extrabold text-white">이애진 님</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-white/70 font-bold block mb-0.5">상위 5%</span>
              <span className="text-xl font-black text-white">+85%</span>
            </div>
          </div>
          {/* Crown Icon Box Overlay Removed as requested */}
        </div>

        {/* Ranking List */}
        <div className="space-y-3">
          {rankingData.map((user) => {
            let badgeStyle = "bg-gray-100 text-gray-400";
            
            if (user.rank === 1) {
              badgeStyle = "bg-gradient-to-br from-[#FCD34D] to-[#B45309] text-white shadow-md shadow-amber-500/20";
            } else if (user.rank === 2) {
              badgeStyle = "bg-gradient-to-br from-[#E5E7EB] to-[#6B7280] text-white shadow-md shadow-gray-400/20";
            } else if (user.rank === 3) {
              badgeStyle = "bg-gradient-to-br from-[#E8AC73] to-[#78350F] text-white shadow-md shadow-orange-700/20";
            }

            return (
              <div 
                key={user.rank}
                className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-green-50/50"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${badgeStyle} relative`}>
                    {user.rank}
                    {user.rank === 1 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FBBF24] rounded-full border border-white"></div>}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1">
                      <h3 className="font-bold text-gray-800 text-sm">{user.name}</h3>
                      <span className="text-[10px] font-bold text-gray-400">LV{user.level}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium">{user.amount}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp size={14} className="text-red-500" />
                  <span className="font-black text-sm text-red-500">{user.profit}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Button */}
        <button className="mt-5 w-full py-4 bg-white/70 hover:bg-white transition-all rounded-2xl flex items-center justify-center space-x-1 text-[#2D8C69] font-bold text-sm shadow-sm border border-white">
          <span>전체 순위 보기</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default RankingContent;
