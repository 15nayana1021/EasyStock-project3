import React, { useState, useRef, useEffect } from "react";
import { CalendarDays, Bell, X } from "lucide-react";
import { NotificationItem } from "../types";

interface HeaderProps {
  showProfile: boolean;
  notifications: NotificationItem[];
  onMarkAsRead: () => void;
  nickname?: string;
  level?: number;
}

const Header: React.FC<HeaderProps> = ({
  showProfile,
  notifications,
  onMarkAsRead,
  nickname,
  level,
}) => {
  // Using a placeholder image that resembles the requested squirrel character
  const squirrelUrl =
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Lucky&backgroundColor=b6e3f4";
  const hasUnread = notifications.some((n) => !n.isRead);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleBellClick = () => {
    if (!isDropdownOpen && hasUnread) {
      onMarkAsRead();
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown when clicking outside
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

  return (
    <div className="p-5 flex justify-between items-center bg-transparent min-h-[80px] relative z-50">
      {showProfile ? (
        <div className="flex items-center space-x-2 animate-in fade-in duration-300">
          <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-white flex items-center justify-center">
            <img
              src={squirrelUrl}
              alt="Avatar"
              className="w-9 h-9 object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 leading-none">
              {nickname || "투자자"} ·{" "}
              <span className="text-gray-400 font-medium text-sm">
                Lv{level || 1}
              </span>
            </h1>
          </div>
        </div>
      ) : (
        <div className="w-10 h-10"></div> /* Placeholder to keep layout balanced or just empty */
      )}

      <div className="flex items-center space-x-3 relative" ref={dropdownRef}>
        {/* Notification Bell */}
        <button
          onClick={handleBellClick}
          className="bg-white/80 backdrop-blur-sm border border-green-100 px-3 py-1.5 rounded-full flex items-center justify-center shadow-sm relative h-[32px] w-[42px] hover:bg-white transition-colors"
        >
          <Bell size={16} className="text-gray-600" />
          {hasUnread && (
            <div className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></div>
          )}
        </button>

        {/* Notification Dropdown */}
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
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${noti.type === "buy" ? "bg-red-400" : "bg-blue-400"}`}
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

        {/* Calendar */}
        <div className="bg-white/80 backdrop-blur-sm border border-green-100 px-3 py-1.5 rounded-full flex items-center space-x-2 shadow-sm h-[32px]">
          <CalendarDays size={16} className="text-green-600" />
          <span className="text-xs font-semibold text-gray-700">
            02.03 (월)
          </span>
        </div>
      </div>
    </div>
  );
};

export default Header;
