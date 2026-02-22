import React, { useState, useEffect } from "react";
import { TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { fetchRanking } from "../services/api";

// 🟢 1번 파일(사용자님): 백엔드 데이터에 맞는 확장된 인터페이스 유지
interface RankUser {
  rank: number;
  name: string;
  level: number;
  amount: string;
  profit: string;
  isUp: boolean;
}

const RankingContent: React.FC = () => {
  const [rankingList, setRankingList] = useState<RankUser[]>([]);
  const [myRankInfo, setMyRankInfo] = useState<RankUser | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const handleShowMore = () => setVisibleCount((prev) => prev + 10);
  const handleShowLess = () => setVisibleCount(5);

  const visibleRankings = rankingList.slice(0, visibleCount);
  const hasMore = rankingList.length > visibleCount;

  const myNickname = localStorage.getItem("stocky_nickname") || "투자자";

  useEffect(() => {
    const loadRanking = async () => {
      const data = await fetchRanking();

      if (data && data.length > 0) {
        const mappedData: RankUser[] = data.map((item: any, index: number) => {
          const name = item.username || item.name || `유저${index + 1}`;
          const amount = item.total_assets || item.balance || item.amount || 0;
          const profitRate = item.profit_rate || item.profit || 0;

          return {
            rank: item.rank || index + 1,
            name: name,
            level: item.level || Math.floor(Math.random() * 10) + 1,
            amount: `${Number(amount).toLocaleString()}원`,
            profit: `${profitRate > 0 ? "+" : ""}${Number(profitRate).toFixed(2)}%`,
            isUp: profitRate >= 0,
          };
        });

        setRankingList(mappedData);

        const me = mappedData.find((user) => user.name === myNickname);
        if (me) {
          setMyRankInfo(me);
        }
      }
    };

    loadRanking();
    const interval = setInterval(loadRanking, 5000);
    return () => clearInterval(interval);
  }, [myNickname]);

  return (
    <div className="flex flex-col h-full bg-[#CFE3FA] rounded-t-[2.5rem] border border-white/50 shadow-inner overflow-hidden">
      {/* Header (팀원 중앙 정렬 디자인) */}
      <div className="p-5 pb-2 text-center">
        <div className="flex items-center justify-center">
          <h2 className="text-xl font-extrabold tracking-tight text-gray-800">
            랭킹
          </h2>
        </div>
        <p className="text-[11px] text-gray-500 font-bold mt-1.5 opacity-80">
          지금 사람들이 가장 많이 따라하고 있는 투자 고수
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 hide-scrollbar pb-32">
        {myRankInfo ? (
          <div className="relative mt-2 mb-6 animate-in slide-in-from-top-2">
            <div className="bg-[#004FFE] rounded-[2rem] p-5 flex items-center justify-between shadow-lg shadow-blue-900/10">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center text-white font-black text-lg">
                  {myRankInfo.rank}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/70 font-bold">
                    나의 통합 수익률
                  </span>
                  <span className="text-lg font-extrabold text-white">
                    {myRankInfo.name} 님
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-white/70 font-bold block mb-0.5">
                  총 자산 {myRankInfo.amount}
                </span>
                <span
                  className={`text-xl font-black ${myRankInfo.isUp ? "text-white" : "text-blue-200"}`}
                >
                  {myRankInfo.profit}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-2 mb-6 bg-gray-200/50 rounded-[2rem] p-5 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-500">
              순위 밖이거나 데이터를 불러오는 중입니다.
            </span>
          </div>
        )}

        {/* 랭킹 리스트 */}
        <div className="space-y-3">
          {rankingList.length > 0 ? (
            visibleRankings.map((user) => {
              let badgeStyle = "bg-gray-100 text-gray-400";

              if (user.rank === 1) {
                badgeStyle =
                  "text-white shadow-[0_4px_10px_rgba(251,191,36,0.3),inset_0_-2px_4px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.4)] bg-gradient-to-br from-[#FCD34D] via-[#FBBF24] to-[#B45309]";
              } else if (user.rank === 2) {
                badgeStyle =
                  "text-white shadow-[0_4px_10px_rgba(192,192,192,0.3),inset_0_-2px_4px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.4)] bg-gradient-to-br from-[#E5E7EB] via-[#C0C0C0] to-[#6B7280]";
              } else if (user.rank === 3) {
                badgeStyle =
                  "text-white shadow-[0_4px_10px_rgba(205,127,50,0.3),inset_0_-2px_4px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.4)] bg-gradient-to-br from-[#E8AC73] via-[#CD7F32] to-[#78350F]";
              }

              return (
                <div
                  key={user.rank}
                  className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-blue-50/50 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${badgeStyle} relative`}
                    >
                      {user.rank}
                      {/* 1등 전용 노란색 점선 마크 추가 */}
                      {user.rank === 1 && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FBBF24] rounded-full border border-white"></div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1">
                        <h3 className="font-bold text-gray-800 text-sm">
                          {user.name}
                        </h3>
                        <span className="text-[10px] font-bold text-gray-400">
                          LV{user.level}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 font-medium">
                        {user.amount}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    {user.isUp && (
                      <TrendingUp size={14} className="text-[#E53935]" />
                    )}
                    <span
                      className={`font-black text-sm ${user.isUp ? "text-[#E53935]" : "text-[#1E88E5]"}`}
                    >
                      {user.profit}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm font-bold">
              랭킹 데이터를 불러오는 중입니다...
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          {hasMore && (
            <button
              onClick={handleShowMore}
              className="flex-1 py-4 bg-white/70 hover:bg-white transition-all rounded-2xl flex items-center justify-center space-x-1 text-[#004FFE] font-bold text-sm shadow-sm border border-white"
            >
              <span>더보기 ({rankingList.length - visibleCount}개 남음)</span>
              <ChevronDown size={16} />
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
  );
};

export default RankingContent;
