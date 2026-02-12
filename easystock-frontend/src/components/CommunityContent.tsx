
import React from 'react';
import { MessageSquare, Heart, Send } from 'lucide-react';

interface PostItem {
  id: number;
  user: string;
  content: string;
  likes: number;
  comments: number;
}

const postsData: PostItem[] = [
  {
    id: 1,
    user: '로건형 어우',
    content: '오늘 삼성전자 실적 발표인데 AI 수혜주 영향 있을까요?',
    likes: 13,
    comments: 4,
  },
  {
    id: 2,
    user: '비범형 누에',
    content: '어제 급락장은 좀 과도했던 듯\n오늘 반등 가능성 체크해봅니다.',
    likes: 9,
    comments: 3,
  },
  {
    id: 3,
    user: '화정형 진도개',
    content: '반도체 섹터 다시 살아나는 흐름\n중장기 관점 괜찮아 보입니다.',
    likes: 10,
    comments: 5,
  },
  {
    id: 4,
    user: '성공투자자',
    content: '나스닥 선물 지수 보니까 오늘 밤 미장도 뜨거울 것 같네요. 다들 성투하세요!',
    likes: 15,
    comments: 2,
  },
  {
    id: 5,
    user: '주린이성장기',
    content: '배당금 입금됐네요! 소소하지만 기분 좋습니다. 재투자 바로 들어갑니다.',
    likes: 22,
    comments: 8,
  },
];

const CommunityContent: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#E8F3EF] rounded-t-[2.5rem] border border-white/50 shadow-inner overflow-hidden">
      {/* Fixed Component Header */}
      <div className="p-5 pb-3">
        <div className="flex items-center space-x-2 ml-1">
          <div className="text-[#2D8C69]">
            <MessageSquare size={22} fill="currentColor" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">커뮤니티</h2>
        </div>
      </div>

      {/* Scrollable Feed Area */}
      <div className="flex-1 overflow-y-auto px-5 hide-scrollbar space-y-3">
        {postsData.map((post) => (
          <div 
            key={post.id}
            className="bg-white rounded-2xl p-5 shadow-sm border border-green-50/50"
          >
            <div className="flex flex-col space-y-2">
              <h3 className="text-sm font-bold text-gray-800">{post.user}</h3>
              <p className="text-sm text-gray-600 font-medium whitespace-pre-line leading-relaxed">
                {post.content}
              </p>
              
              <div className="h-[1px] w-full bg-gray-50 my-1"></div>

              <div className="flex items-center space-x-4 pt-1">
                <div className="flex items-center space-x-1.5 group cursor-pointer">
                  <Heart size={16} className="text-gray-300 group-hover:text-red-400 transition-colors" />
                  <span className="text-xs font-bold text-gray-400">{post.likes}</span>
                </div>
                <div className="flex items-center space-x-1.5 group cursor-pointer">
                  <MessageSquare size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                  <span className="text-xs font-bold text-gray-400">{post.comments}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {/* Padding at the bottom of the list so last post isn't hidden by the fixed input bar */}
        <div className="h-4"></div>
      </div>

      {/* Fixed Chat Input Bar Area at the bottom of the component */}
      {/* pb-28 accounts for the height of the BottomNav plus some breathing room */}
      <div className="px-4 pt-4 pb-28 bg-gradient-to-t from-[#E8F3EF] via-[#E8F3EF] to-transparent">
        <div className="bg-white rounded-full p-1.5 pl-5 shadow-lg border border-white flex items-center justify-between">
          <input 
            type="text" 
            placeholder="자유롭게 의견을 남겨보세요..." 
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-600 placeholder-gray-300 font-medium"
          />
          <button className="w-9 h-9 bg-[#2D8C69] text-white rounded-full flex items-center justify-center hover:bg-[#247054] transition-all active:scale-95 shadow-md ml-2">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunityContent;
