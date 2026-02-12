import React, { useState } from "react";
import {
  ChevronRight,
  Bell,
  Moon,
  Info,
  User,
  Megaphone,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";

const SettingsContent: React.FC = () => {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [eduEnabled, setEduEnabled] = useState(true);
  const [marketEnabled, setMarketEnabled] = useState(true);

  // Character URL (matching image 6)
  const userAvatarUrl =
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Lucky&backgroundColor=b6e3f4";

  return (
    <div className="flex flex-col h-full bg-[#E9EEF3] overflow-hidden font-['Pretendard']">
      {/* Title Header */}
      <div className="px-6 pt-8 pb-6 shrink-0">
        <h1 className="text-[24px] font-black text-[#1A334E] tracking-tight">
          환경 설정
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 space-y-5 pb-10 hide-scrollbar">
        {/* Profile Card Section */}
        <div className="bg-[#56987C] rounded-[2.5rem] p-6 shadow-lg shadow-[#56987C]/20 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all border border-white/10">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-[#D1E8E0] rounded-[1.5rem] flex items-center justify-center p-0.5 overflow-hidden border-2 border-white/30">
              <img
                src={userAvatarUrl}
                alt="User Avatar"
                className="w-[110%] h-[110%] object-contain mt-2"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[20px] font-black text-white tracking-tight">
                  이예진 사원
                </span>
                <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white border border-white/30">
                  Lv.4
                </span>
              </div>
            </div>
          </div>
          <ChevronRight className="text-white opacity-60" size={28} />
        </div>

        {/* Notification Settings Group */}
        <div className="bg-white rounded-[2.5rem] p-7 shadow-sm space-y-7">
          <div className="flex items-center space-x-2 pb-1">
            <Bell size={20} className="text-[#2D8C69]" strokeWidth={3} />
            <span className="text-[17px] font-black text-[#1A334E] tracking-tight">
              알림 설정
            </span>
          </div>

          {/* Toggle Items */}
          <div className="space-y-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col flex-1">
                <span className="text-[15px] font-black text-[#1A334E]">
                  푸시 알림 <span className="text-[#2D8C69]">ON/OFF</span>
                </span>
                <span className="text-[12px] text-gray-400 font-bold mt-0.5">
                  전체 알림 ON/OFF
                </span>
              </div>
              <div className="shrink-0">
                <ToggleButton
                  enabled={pushEnabled}
                  onClick={() => setPushEnabled(!pushEnabled)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col flex-1">
                <span className="text-[15px] font-black text-[#1A334E]">
                  교육 콘텐츠 알림
                </span>
                <span className="text-[12px] text-gray-400 font-bold mt-0.5">
                  새로운 강의, 퀘스트 업데이트 소식
                </span>
              </div>
              <div className="shrink-0">
                <ToggleButton
                  enabled={eduEnabled}
                  onClick={() => setEduEnabled(!eduEnabled)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col flex-1">
                <span className="text-[15px] font-black text-[#1A334E]">
                  시장 브리핑 알림
                </span>
                <span className="text-[12px] text-gray-400 font-bold mt-0.5">
                  투자 관련 주요 뉴스나 시황 요약 알림
                </span>
              </div>
              <div className="shrink-0">
                <ToggleButton
                  enabled={marketEnabled}
                  onClick={() => setMarketEnabled(!marketEnabled)}
                />
              </div>
            </div>

            {/* Time Setting Item */}
            <div className="flex items-center justify-between cursor-pointer group pt-1 gap-4">
              <div className="flex items-center space-x-4 flex-1 overflow-hidden">
                <div className="w-11 h-11 rounded-full bg-[#F4F8F6] flex items-center justify-center text-[#2D8C69] border border-[#E8F3EF] shrink-0">
                  <Moon size={22} fill="currentColor" className="opacity-80" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[15px] font-black text-[#1A334E] truncate">
                    야간 알림 제한
                  </span>
                  <span className="text-[12px] text-gray-400 font-bold mt-0.5 truncate">
                    밤 9시 ~ 아침 8시 알림 방지 기능
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-1 shrink-0">
                <span className="text-[13px] font-black text-gray-400 whitespace-nowrap">
                  21:00 ~ 08:00
                </span>
                <ChevronRight
                  size={20}
                  className="text-gray-300 group-hover:text-gray-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* App Info Group */}
        <div className="bg-white rounded-[2.5rem] p-7 py-5 shadow-sm space-y-2 overflow-hidden">
          <MenuListItem icon={<Info size={20} />} label="앱 정보 & 고객 지원" />
          <div className="h-[1px] w-full bg-gray-50 my-1"></div>
          <MenuListItem icon={<User size={20} />} label="내 정보" />
          <div className="h-[1px] w-full bg-gray-50 my-1"></div>
          <MenuListItem icon={<Megaphone size={20} />} label="공지사항" />
          <div className="h-[1px] w-full bg-gray-50 my-1"></div>
          <MenuListItem
            icon={<HelpCircle size={20} />}
            label="자주 묻는 질문 (FAQ)"
          />
          <div className="h-[1px] w-full bg-gray-50 my-1"></div>
          <MenuListItem
            icon={<ShieldCheck size={20} />}
            label="약관 및 개인정보 처리방침"
          />
        </div>
      </div>
    </div>
  );
};

// Standardized Toggle Component
const ToggleButton: React.FC<{ enabled: boolean; onClick: () => void }> = ({
  enabled,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`w-14 h-7 rounded-full transition-all relative flex items-center p-1 ${
      enabled ? "bg-[#2D8C69]" : "bg-gray-200 shadow-inner"
    }`}
  >
    <div
      className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${
        enabled ? "translate-x-7" : "translate-x-0"
      }`}
    />
  </button>
);

const MenuListItem: React.FC<{ icon: React.ReactNode; label: string }> = ({
  icon,
  label,
}) => (
  <div className="flex items-center justify-between py-4 cursor-pointer group">
    <div className="flex items-center space-x-4">
      <div className="text-gray-300 group-hover:text-[#2D8C69] transition-colors">
        {icon}
      </div>
      <span className="text-[15px] font-black text-[#1A334E] tracking-tight">
        {label}
      </span>
    </div>
    <ChevronRight
      size={20}
      className="text-gray-300 group-hover:text-gray-500 transition-colors"
    />
  </div>
);

export default SettingsContent;
