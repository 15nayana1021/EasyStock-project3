
import React from 'react';
import { Wallet, Newspaper, TrendingUp, Trophy, MessageCircle, ScrollText } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const tabs = [
    { id: 'assets', label: '자산', icon: <Wallet size={20} />, path: '/assets' },
    { id: 'news', label: '뉴스', icon: <Newspaper size={20} />, path: '/news' },
    { id: 'popular', label: '인기', icon: <TrendingUp size={20} />, path: '/' },
    { id: 'ranking', label: '랭킹', icon: <Trophy size={20} />, path: '/ranking' },
    { id: 'community', label: '커뮤니티', icon: <MessageCircle size={20} />, path: '/community' },
    { id: 'quest', label: '퀘스트', icon: <ScrollText size={20} />, path: '/quest' },
  ];

  return (
    <div className="bg-white rounded-t-2xl rounded-b-none py-4 px-1 flex flex-col items-center space-y-2 shadow-sm border border-gray-100 h-[calc(100%+100px)] pb-32">
      {tabs.map((tab) => (
        <NavLink
          key={tab.id}
          to={tab.path}
          className={({ isActive }) => `
            w-12 h-14 flex flex-col items-center justify-center rounded-2xl transition-all duration-200
            ${isActive
              ? 'bg-[#2D8C69] text-white shadow-md' 
              : 'text-gray-400 hover:bg-gray-50'
            }
          `}
        >
          {tab.icon}
          <span className="text-[9px] mt-1 font-bold">{tab.label}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default Sidebar;