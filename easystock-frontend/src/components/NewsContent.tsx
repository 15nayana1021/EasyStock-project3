import React, { useState, useEffect } from "react";
import { fetchNewsList, fetchNewsDetail, NewsItem } from "../services/api";
import { ChevronDown } from "lucide-react";

const NewsContent: React.FC = () => {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [visibleCount, setVisibleCount] = useState(5);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  // 1. 컴포넌트가 켜지면 백엔드에서 뉴스 가져오기
  useEffect(() => {
    const loadNews = async () => {
      try {
        const data = await fetchNewsList();
        setNewsList(data);
      } catch (error) {
        console.error("뉴스 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, []);

  const handleNewsClick = async (id: number) => {
    try {
      // 로딩 표시를 잠깐 하고 싶다면 로컬 state 추가 가능
      const detail = await fetchNewsDetail(id);
      setSelectedNews(detail);
    } catch (error) {
      console.error("뉴스 상세 로딩 실패:", error);
      alert("뉴스 본문을 불러올 수 없습니다.");
    }
  };

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 5);
  };

  const visibleNews = newsList.slice(0, visibleCount);
  const hasMore = newsList.length > visibleCount;

  // 뒤로가기 핸들러
  const handleBack = () => {
    setSelectedNews(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#E8F3EF] rounded-t-[2.5rem] border border-white/50 shadow-inner overflow-hidden">
      {/* 조건부 렌더링: 상세 뉴스가 있으면 상세화면, 없으면 목록화면 */}
      {selectedNews ? (
        // 상세 보기 화면
        <div className="flex flex-col h-full p-5 overflow-y-auto hide-scrollbar">
          {/* 뒤로가기 버튼 */}
          <button
            onClick={handleBack}
            className="mb-4 flex items-center text-gray-500 hover:text-gray-800 transition-colors text-sm font-bold"
          >
            ← 목록으로
          </button>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-green-50">
            {/* 카테고리 & 날짜 */}
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                {selectedNews.category || "일반"}
              </span>
              <span className="text-[10px] text-gray-400">
                {selectedNews.published_at
                  ? new Date(selectedNews.published_at).toLocaleDateString()
                  : ""}
              </span>
            </div>

            {/* 제목 */}
            <h2 className="text-lg font-extrabold text-gray-900 leading-tight mb-4">
              {selectedNews.title}
            </h2>

            {/* 본문 내용 */}
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
        <>
          <div className="p-5 pb-3">
            <div className="flex justify-center">
              <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">
                NEWS
              </h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 hide-scrollbar pb-32">
            <div className="flex flex-col space-y-3 mt-1">
              {loading ? (
                <div className="text-center py-10 text-gray-400 text-xs font-bold">
                  뉴스를 불러오는 중입니다...
                </div>
              ) : visibleNews.length > 0 ? (
                visibleNews.map((news) => (
                  <div
                    key={news.id}
                    onClick={() => handleNewsClick(news.id)}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-green-50/50 hover:border-green-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-gray-400">
                        • {news.category || "일반"}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-gray-800 leading-snug mb-1">
                      {news.title}
                    </h3>
                    <p className="text-[12px] text-gray-500 font-medium opacity-80 line-clamp-2">
                      {news.summary}
                    </p>
                    <div className="mt-3 flex justify-end items-center text-[10px] text-gray-400 gap-2">
                      <span className="font-medium text-gray-500">
                        — {news.source || "Stocky News"}
                      </span>
                      {news.published_at && (
                        <span>
                          {new Date(news.published_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-400 text-xs font-bold">
                  등록된 뉴스가 없습니다.
                </div>
              )}
              {!loading && hasMore && (
                <button
                  onClick={handleShowMore}
                  className="w-full py-4 bg-white/50 hover:bg-white rounded-2xl flex items-center justify-center space-x-2 text-gray-500 font-bold text-xs transition-all active:scale-[0.98] border border-white mt-4 shadow-sm"
                >
                  <ChevronDown size={14} />
                  <span>더보기 ({newsList.length - visibleCount}개 남음)</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NewsContent;
