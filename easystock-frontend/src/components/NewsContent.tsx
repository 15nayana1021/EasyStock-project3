import React, { useState } from "react";
import { fetchNewsDetail, NewsItem } from "../services/api";
import { ChevronDown, ChevronUp } from "lucide-react";

interface NewsProps {
  activeNews: NewsItem[];
}

const NewsContent: React.FC<NewsProps> = ({ activeNews }) => {
  const [visibleCount, setVisibleCount] = useState(5);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  const handleNewsClick = async (id: number) => {
    try {
      const detail = await fetchNewsDetail(id);
      setSelectedNews(detail);
    } catch (error) {
      console.error("뉴스 상세 로딩 실패:", error);
      alert("뉴스 본문을 불러올 수 없습니다.");
    }
  };

  const handleShowMore = () => setVisibleCount((prev) => prev + 5);
  const handleBack = () => setSelectedNews(null);
  const handleShowLess = () => setVisibleCount(5);

  const visibleNews = activeNews.slice(0, visibleCount);
  const hasMore = activeNews.length > visibleCount;

  return (
    <div className="flex flex-col h-full bg-[#CFE3FA] rounded-t-[2.5rem] border border-white/50 shadow-inner overflow-hidden">
      {selectedNews ? (
        // 상세 보기 화면 (블루 테마에 맞게 디자인 수정)
        <div className="flex flex-col h-full p-5 overflow-y-auto hide-scrollbar">
          <button
            onClick={handleBack}
            className="mb-4 flex items-center text-gray-500 hover:text-[#004FFE] transition-colors text-sm font-bold"
          >
            ← 목록으로
          </button>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-blue-50">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-[#004FFE] bg-[#004FFE]/10 px-2 py-1 rounded-full">
                {selectedNews.category || "일반"}
              </span>
              <span className="text-[10px] text-gray-400">
                {selectedNews.display_date || "02.26 09:00"}
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-[#1A334E] leading-tight mb-4">
              {selectedNews.title}
            </h2>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {selectedNews.content ||
                selectedNews.summary ||
                "내용이 없습니다."}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 text-right text-xs text-gray-400">
              Source: {selectedNews.source || "Stocky News"}
            </div>
          </div>
        </div>
      ) : (
        // 목록 화면 (2번 파일의 카드 디자인과 호버 액션 적용)
        <div className="flex-1 overflow-y-auto px-5 hide-scrollbar pb-32">
          <div className="flex flex-col space-y-3 pt-5">
            <div className="flex justify-center mb-2">
              <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">
                NEWS
              </h2>
            </div>

            {visibleNews.length > 0 ? (
              visibleNews.map((news, index) => (
                <div
                  key={`${news.id}-${index}`}
                  onClick={() => handleNewsClick(news.id)}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-blue-50/50 hover:border-blue-200 transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-1 duration-300"
                >
                  <div className="flex flex-col space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 group-hover:text-[#004FFE] transition-colors">
                      • {news.category || "일반"}
                    </span>
                    <h3 className="text-base font-extrabold text-[#1A334E] leading-snug">
                      {news.title}
                    </h3>
                    <p className="text-[12px] text-gray-500 font-medium opacity-80 pt-0.5 line-clamp-2">
                      {news.summary}
                    </p>
                    <div className="mt-3 flex justify-end items-center text-[10px] text-gray-400 gap-2">
                      <span className="font-medium text-gray-500">
                        — {news.source || "Stocky News"}
                      </span>
                      <span>{news.display_date}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-400 text-xs font-bold">
                등록된 뉴스가 없습니다.
              </div>
            )}

            {/* 더보기 & 접기 버튼 (사용자님의 투버튼 로직 + 팀원 디자인) */}
            <div className="flex gap-2 mt-4">
              {hasMore && (
                <button
                  onClick={handleShowMore}
                  className="flex-1 py-4 bg-white/50 hover:bg-white rounded-2xl flex items-center justify-center space-x-2 text-gray-500 font-bold text-xs transition-all active:scale-[0.98] border border-white shadow-sm"
                >
                  <ChevronDown size={14} />
                  <span>
                    더보기 ({activeNews.length - visibleCount}개 남음)
                  </span>
                </button>
              )}

              {visibleCount > 5 && (
                <button
                  onClick={handleShowLess}
                  className="flex-1 py-4 bg-white/50 hover:bg-white rounded-2xl flex items-center justify-center space-x-2 text-gray-500 font-bold text-xs transition-all active:scale-[0.98] border border-white shadow-sm"
                >
                  <ChevronUp size={14} />
                  <span>접기</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsContent;
