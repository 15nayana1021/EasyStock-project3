import React, { useState, useRef, useEffect } from "react";
import { CalendarDays, Bell, X } from "lucide-react";
import { NotificationItem } from "../types";
// 팀원분이 적용한 다람쥐 프로필 이미지! (assets 폴더에 있어야 합니다)
import profileSquirrel from "../assets/profile_squirrel.png";

// 🟢 1번 파일(사용자님)의 Props 유지: App.tsx가 넘겨주는 진짜 데이터들
interface HeaderProps {
  showProfile: boolean;
  notifications: NotificationItem[];
  onMarkAsRead: () => void;
  nickname?: string;
  level?: number;
  virtualDate?: string;
}

const Header: React.FC<HeaderProps> = ({
  showProfile,
  notifications,
  onMarkAsRead,
  nickname,
  level,
  virtualDate,
}) => {
  const hasUnread = notifications.some((n) => !n.isRead);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleBellClick = () => {
    if (!isDropdownOpen && hasUnread) {
      onMarkAsRead();
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  // 외부 클릭 시 알림창 닫기 로직 유지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 🔵 2번 파일(팀원)의 깔끔한 블루 테마 디자인 적용
  return (
    <div className="p-5 flex justify-between items-center bg-transparent min-h-[80px] relative z-50">
      {showProfile ? (
        <div className="flex items-center space-x-2 animate-in fade-in duration-300">
          <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-white flex items-center justify-center">
            {/* 귀여운 다람쥐 프로필 이미지 */}
            <img
              src={profileSquirrel}
              alt="Avatar"
              className="w-9 h-9 object-contain"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              {/* 🟢 가짜 데이터 대신 사용자님의 진짜 닉네임과 레벨 적용 */}
              <span className="text-[20px] font-black text-[#1A334E] tracking-tight">
                {nickname || "투자자"}
              </span>
              <span className="bg-[#004FFE]/10 px-3 py-1 rounded-full text-[11px] font-black text-[#004FFE] border border-[#004FFE]/20 leading-none flex items-center justify-center translate-y-[1px]">
                Lv.{level || 1}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-10 h-10"></div>
      )}

      <div className="flex items-center space-x-3 relative" ref={dropdownRef}>
        {/* 알림 벨 아이콘 */}
        <button
          onClick={handleBellClick}
          className="bg-white/80 backdrop-blur-sm border border-[#CFE3FA] px-3 py-1.5 rounded-full flex items-center justify-center shadow-sm relative h-[32px] w-[42px] hover:bg-white transition-colors"
        >
          <Bell size={16} className="text-gray-600" />
          {hasUnread && (
            <div className="absolute top-1 right-2 w-2 h-2 bg-[#E53935] rounded-full border border-white animate-pulse"></div>
          )}
        </button>

        {/* 알림 드롭다운 */}
        {isDropdownOpen && (
          <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
            <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-[#F9FAFB]">
              <span className="text-xs font-black text-gray-800">
                알림 센터
              </span>
              <button
                onClick={() => setIsDropdownOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto hide-scrollbar">
              {notifications.length > 0 ? (
                notifications.map((noti) => (
                  <div
                    key={noti.id}
                    className="px-4 py-3 border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${noti.type === "buy" ? "bg-[#E53935]" : "bg-[#1E88E5]"}`}
                      ></div>
                      <div className="flex flex-col">
                        <p className="text-xs font-bold text-gray-800 leading-snug">
                          {noti.message}
                        </p>
                        <span className="text-[10px] text-gray-400 mt-1 font-medium">
                          {noti.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-400 text-xs font-bold">
                  새로운 알림이 없습니다.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 달력 (가상 시간) */}
        <div className="bg-white/80 backdrop-blur-sm border border-[#CFE3FA] px-3 py-1.5 rounded-full flex items-center space-x-2 shadow-sm h-[32px]">
          <CalendarDays size={16} className="text-[#004FFE]" />
          {/* 🟢 하드코딩된 날짜 제거, 백엔드 연동 날짜(virtualDate) 부활 */}
          <span className="text-xs font-semibold text-gray-700">
            {virtualDate || "02.26 (목)"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Header;
