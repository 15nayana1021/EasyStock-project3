
import React from 'react';
import { generalNewsList } from '../data/mockData';

const NewsContent: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#E8F3EF] rounded-t-[2.5rem] border border-white/50 shadow-inner overflow-hidden">
      {/* Sticky Header inside component - Changed to 'NEWS' and centered */}
      <div className="p-5 pb-3">
        <div className="flex justify-center">
          <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">NEWS</h2>
        </div>
      </div>

      {/* Internal Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 hide-scrollbar pb-32">
        <div className="flex flex-col space-y-3 mt-1">
          {generalNewsList.map((news) => (
            <div 
              key={news.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-green-50/50 hover:border-green-200 transition-all cursor-pointer group"
            >
              <div className="flex flex-col space-y-1">
                <span className="text-[11px] font-bold text-gray-400 group-hover:text-[#2D8C69] transition-colors">• {news.category}</span>
                <h3 className="text-base font-extrabold text-gray-800 leading-snug">{news.title}</h3>
                <p className="text-[12px] text-gray-500 font-medium opacity-80 pt-0.5">{news.summary}</p>
                <div className="flex justify-end pt-2">
                  <span className="text-[10px] text-gray-400 font-medium">— {news.source}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsContent;
