
import React, { useState } from 'react';
import { 
  ChevronRight, 
  Bell, 
  Moon, 
  Info, 
  User, 
  Megaphone, 
  HelpCircle, 
  ShieldCheck,
  BookOpen,
  Layout
} from 'lucide-react';

const SettingsContent: React.FC = () => {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [eduEnabled, setEduEnabled] = useState(true);
  const [marketEnabled, setMarketEnabled] = useState(true);

  // Squirrel character URL (consistent with Header)
  const squirrelUrl = "https://api.dicebear.com/7.x/adventurer/svg?seed=Lucky&backgroundColor=b6e3f4";

  return (
    <div className="flex flex-col h-full bg-[#E9EEF3] overflow-hidden">
      {/* Title Header */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-xl font-black text-gray-800">환경 설정</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 space-y-4 pb-32 hide-scrollbar">
        {/* Profile Card Section */}
        <div className="bg-gradient-to-r from-[#68B297] to-[#40856C] rounded-[2rem] p-5 shadow-lg shadow-green-900/10 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center p-1 border border-white/20 overflow-hidden">
               <img src={squirrelUrl} alt="User Avatar" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black text-white">이예진 사원</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold text-white border border-white/20">Lv.4</span>
              </div>
            </div>
          </div>
          <ChevronRight className="text-white opacity-60" size={24} />
        </div>

        {/* Notification Settings Group */}
        <div className="bg-white rounded-[2rem] p-5 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 pb-2">
            <Bell size={18} className="text-[#2D8C69]" />
            <span className="text-sm font-black text-gray-800">알림 설정</span>
          </div>

          {/* Toggle Items */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-800">푸시 알림 <span className="text-[#2D8C69]">ON/OFF</span></span>
                <span className="text-[11px] text-gray-400 font-medium">전체 알림 ON/OFF</span>
              </div>
              <ToggleButton enabled={pushEnabled} onClick={() => setPushEnabled(!pushEnabled)} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-800">교육 콘텐츠 알림</span>
                <span className="text-[11px] text-gray-400 font-medium">새로운 강의, 퀘스트 업데이트 소식</span>
              </div>
              <ToggleButton enabled={eduEnabled} onClick={() => setEduEnabled(!eduEnabled)} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-800">시장 브리핑 알림</span>
                <span className="text-[11px] text-gray-400 font-medium">투자 관련 주요 뉴스나 시황 요약 알림</span>
              </div>
              <ToggleButton enabled={marketEnabled} onClick={() => setMarketEnabled(!marketEnabled)} />
            </div>

            {/* Time Setting Item */}
            <div className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-[#2D8C69]">
                   <Moon size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-800">야간 알림 제한</span>
                  <span className="text-[11px] text-gray-400 font-medium">밤 9시 ~ 아침 8시 알림 방지 기능</span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-bold text-gray-400">21:00 ~ 08:00</span>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* App Info Group */}
        <div className="bg-white rounded-[2rem] p-5 shadow-sm space-y-2 overflow-hidden">
          <MenuListItem icon={<Info size={18} />} label="앱 정보 & 고객 지원" />
          <div className="h-[1px] w-full bg-gray-50 my-1"></div>
          <MenuListItem icon={<User size={18} />} label="내 정보" />
          <MenuListItem icon={<Megaphone size={18} />} label="공지사항" />
          <MenuListItem icon={<HelpCircle size={18} />} label="자주 묻는 질문 (FAQ)" />
          <MenuListItem icon={<ShieldCheck size={18} />} label="약관 및 개인정보 처리방침" />
        </div>
      </div>
    </div>
  );
};

// Helper Components
const ToggleButton: React.FC<{ enabled: boolean; onClick: () => void }> = ({ enabled, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 ${
      enabled ? 'bg-[#2D8C69]' : 'bg-gray-200'
    }`}
  >
    <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform ${
      enabled ? 'translate-x-6' : 'translate-x-0'
    }`} />
  </button>
);

const MenuListItem: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center justify-between py-3 cursor-pointer group">
    <div className="flex items-center space-x-3">
      <div className="text-gray-400 group-hover:text-[#2D8C69] transition-colors">
        {icon}
      </div>
      <span className="text-sm font-bold text-gray-700">{label}</span>
    </div>
    <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
  </div>
);

export default SettingsContent;
