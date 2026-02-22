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
  LogOut,
  Settings2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
// 1번 파일에서 사용하던 이미지와 상수를 그대로 가져옵니다.
import { USER_LEVEL } from "../constants/user";
import profileSquirrel from "../assets/profile_squirrel.png";
import { resetGame } from "../services/api"; // API 함수가 있다면 유지

interface SettingsContentProps {
  userName: string;
  userLevel: string;
}

const SettingsContent: React.FC<SettingsContentProps> = ({
  userName,
  userLevel,
}) => {
  const navigate = useNavigate();

  // 1&2번 공통: 알림 상태 관리
  const [pushEnabled, setPushEnabled] = useState(true);
  const [eduEnabled, setEduEnabled] = useState(true);
  const [marketEnabled, setMarketEnabled] = useState(true);

  // 1번 파일 기능: 로그아웃
  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      localStorage.removeItem("stocky_token");
      localStorage.removeItem("stocky_user_id");
      alert("로그아웃 되었습니다.");
      navigate("/login");
    }
  };

  // 1번 파일 기능: 게임 초기화 (기존의 온보딩 초기화 로직 포함)
  const handleReset = async () => {
    if (
      window.confirm(
        "정말로 게임을 초기화하시겠습니까?\n(모든 자산 및 온보딩 데이터가 삭제됩니다)",
      )
    ) {
      try {
        const userId = localStorage.getItem("stocky_user_id") || "1";
        // 온보딩 로컬 스토리지 삭제 (1번 파일 기능)
        localStorage.removeItem("app-tour-done");

        // API 초기화 요청 (함수가 존재할 경우)
        if (resetGame) await resetGame(parseInt(userId));

        alert("게임이 초기화되었습니다.");
        window.location.reload(); // 초기화 후 새로고침
      } catch (error) {
        console.error("초기화 실패:", error);
        alert("초기화 과정 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#e1eaf5] overflow-hidden font-['Pretendard']">
      {/* Title Header (2번 디자인) */}
      <div className="px-6 pt-8 pb-6 shrink-0">
        <h1 className="text-[24px] font-black text-[#1A334E] tracking-tight">
          환경 설정
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 space-y-5 pb-10 hide-scrollbar">
        {/* Profile Card Section (2번 디자인 + 프롭스 연결) */}
        <div className="bg-[#004FFE] rounded-[2.5rem] p-6 shadow-lg shadow-[#004FFE]/20 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all border border-white/10">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center p-0.5 overflow-hidden border-2 border-white/30">
              {/* 1번 파일에서 사용하던 이미지 사용 */}
              <img
                src={profileSquirrel}
                alt="User Avatar"
                className="w-[90%] h-[90%] object-contain"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[20px] font-black text-white tracking-tight">
                  {userName}
                </span>
                <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[16px] font-bold text-white border border-white/30">
                  {userLevel}
                </span>
              </div>
            </div>
          </div>
          <ChevronRight className="text-white opacity-60" size={28} />
        </div>

        {/* 알림 설정 그룹 (2번 디자인 유지) */}
        <div className="bg-white rounded-[2.5rem] p-7 shadow-sm space-y-7">
          <div className="flex items-center space-x-2 pb-1">
            <Bell size={20} className="text-[#004FFE]" strokeWidth={3} />
            <span className="text-[17px] font-black text-[#1A334E] tracking-tight">
              알림 설정
            </span>
          </div>

          <div className="space-y-8">
            <ToggleItem
              label="푸시 알림 ON/OFF"
              subLabel="전체 알림 ON/OFF"
              enabled={pushEnabled}
              onClick={() => setPushEnabled(!pushEnabled)}
            />
            <ToggleItem
              label="교육 콘텐츠 알림"
              subLabel="새로운 강의, 퀘스트 업데이트 소식"
              enabled={eduEnabled}
              onClick={() => setEduEnabled(!eduEnabled)}
            />
            <ToggleItem
              label="시장 브리핑 알림"
              subLabel="투자 관련 주요 뉴스나 시황 요약 알림"
              enabled={marketEnabled}
              onClick={() => setMarketEnabled(!marketEnabled)}
            />

            {/* 야간 알림 (2번 디자인) */}
            <div className="flex items-center justify-between cursor-pointer group pt-1 gap-4">
              <div className="flex items-center space-x-4 flex-1 overflow-hidden">
                <div className="w-11 h-11 rounded-full bg-[#F5F8FC] flex items-center justify-center text-[#004FFE] border border-[#F5F8FC] shrink-0">
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

        {/* 메뉴 리스트 (2번 디자인) */}
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

          <div className="h-[1px] w-full bg-gray-50 my-1"></div>

          {/* 로그아웃 버튼 추가 */}
          <div
            onClick={handleLogout}
            className="flex items-center justify-between py-4 cursor-pointer group"
          >
            <div className="flex items-center space-x-4">
              <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                <LogOut size={20} />
              </div>
              <span className="text-[15px] font-black text-gray-500 tracking-tight">
                로그아웃
              </span>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </div>

          <div className="h-[1px] w-full bg-gray-50 my-1"></div>

          {/* 게임 초기화 (1번 파일 로직) */}
          <div
            onClick={handleReset}
            className="flex items-center justify-between py-4 cursor-pointer group"
          >
            <div className="flex items-center space-x-4">
              <div className="text-[#E53935] group-hover:text-red-600 transition-colors">
                <HelpCircle size={20} />
              </div>
              <span className="text-[15px] font-black text-[#E53935] tracking-tight">
                전체 데이터 초기화
              </span>
            </div>
            <ChevronRight
              size={20}
              className="text-red-300 group-hover:text-[#E53935] transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// 서브 컴포넌트들

const ToggleItem: React.FC<{
  label: string;
  subLabel: string;
  enabled: boolean;
  onClick: () => void;
}> = ({ label, subLabel, enabled, onClick }) => (
  <div
    className="flex items-center justify-between gap-4 cursor-pointer group active:opacity-80 transition-opacity"
    onClick={onClick}
  >
    <div className="flex flex-col flex-1">
      <span className="text-[15px] font-black text-[#1A334E]">
        {label} {enabled && <span className="text-[#004FFE]">ON</span>}
      </span>
      <span className="text-[12px] text-gray-400 font-bold mt-0.5">
        {subLabel}
      </span>
    </div>
    <div
      className={`w-12 h-6 rounded-full transition-all relative flex items-center ${enabled ? "bg-[#004FFE]" : "bg-gray-200"}`}
    >
      <div
        className={`w-4 h-4 bg-white rounded-full shadow-sm absolute transition-all duration-200 ${enabled ? "left-[calc(100%-1.25rem)]" : "left-1"}`}
      />
    </div>
  </div>
);

const MenuListItem: React.FC<{ icon: React.ReactNode; label: string }> = ({
  icon,
  label,
}) => (
  <div className="flex items-center justify-between py-4 cursor-pointer group">
    <div className="flex items-center space-x-4">
      <div className="text-gray-300 group-hover:text-[#004FFE] transition-colors">
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
