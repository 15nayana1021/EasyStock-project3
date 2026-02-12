
import React from 'react';
import { Home, BarChart2, PieChart, MessageSquare, Settings } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Helper to determine if a tab is active
  const isActive = (id: string) => {
    if (id === 'home') {
       // Home is active if we are on any of the sidebar routes
       return ['/', '/assets', '/news', '/ranking', '/community', '/quest'].includes(currentPath);
    }
    return currentPath.startsWith(`/${id}`);
  };

  const tabs = [
    { id: 'home', label: '홈', icon: <Home size={22} />, path: '/' },
    { id: 'status', label: '주식현황', icon: <BarChart2 size={22} />, path: '/status' },
    { id: 'market', label: '시장', icon: <PieChart size={22} />, path: '/market' },
    { id: 'chatbot', label: '챗봇', icon: <MessageSquare size={22} />, path: '/chatbot' },
    { id: 'settings', label: '설정', icon: <Settings size={22} />, path: '/settings' },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.1)] rounded-t-[2.5rem] border-t border-gray-50 flex justify-around items-center px-4 py-3 pb-6 z-50">
      {tabs.map((tab) => {
        const active = isActive(tab.id);
        return (
          <NavLink
            key={tab.id}
            to={tab.path}
            className={`flex flex-col items-center space-y-1 transition-all duration-200
              ${active ? 'text-[#2D8C69]' : 'text-gray-300'}
            `}
          >
            <div className={`p-1 ${active ? 'scale-110' : ''}`}>
              {tab.icon}
            </div>
            <span className={`text-[10px] font-bold ${active ? 'opacity-100' : 'opacity-80'}`}>
              {tab.label}
            </span>
            {active && (
              <div className="w-1 h-1 bg-[#2D8C69] rounded-full mt-0.5"></div>
            )}
          </NavLink>
        );
      })}
    </div>
  );
};

export default BottomNav;
