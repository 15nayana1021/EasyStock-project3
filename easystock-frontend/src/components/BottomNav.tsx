import React from "react";
import {
  Home,
  BarChart2,
  PieChart,
  MessageSquare,
  Settings,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const BottomNav: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [shouldHighlightMarket, setShouldHighlightMarket] =
    React.useState(false);
  const [shouldHighlightStatus, setShouldHighlightStatus] =
    React.useState(false);
  const [isLv5Reached, setIsLv5Reached] = React.useState(false);

  React.useEffect(() => {
    const checkHighlight = () => {
      const isMarketPending =
        localStorage.getItem("market-highlight-pending") === "true";
      const isStatusPending =
        localStorage.getItem("status-highlight-pending") === "true";
      const isMarketDone = localStorage.getItem("market-tour-done") === "true";
      const isStatusDone = localStorage.getItem("status-tour-done") === "true";

      setShouldHighlightMarket(isMarketPending);
      setShouldHighlightStatus(isStatusPending);
      setIsLv5Reached(isMarketDone || isStatusDone);
    };

    checkHighlight();
    window.addEventListener("storage", checkHighlight);

    // Custom events
    window.addEventListener("check-market-highlight", checkHighlight);
    window.addEventListener("check-status-highlight", checkHighlight);

    return () => {
      window.removeEventListener("storage", checkHighlight);
      window.removeEventListener("check-market-highlight", checkHighlight);
      window.removeEventListener("check-status-highlight", checkHighlight);
    };
  }, []);

  const handleMarketClick = () => {
    // 클릭해도 localStorage를 지우지 않습니다. 투어 완료/스킵 시 지워집니다.
    // if (shouldHighlightMarket) {
    //   setShouldHighlightMarket(false);
    // }
  };

  const handleStatusClick = () => {
    // 클릭해도 localStorage를 지우지 않습니다. 투어 완료/스킵 시 지워집니다.
    // if (shouldHighlightStatus) {
    //   setShouldHighlightStatus(false);
    // }
  };

  // Helper to determine if a tab is active
  const isActive = (id: string) => {
    if (id === "home") {
      // Home is active if we are on any of the sidebar routes
      return [
        "/",
        "/assets",
        "/news",
        "/ranking",
        "/community",
        "/quest",
      ].includes(currentPath);
    }
    return currentPath.startsWith(`/${id}`);
  };

  const tabs = [
    { id: "home", label: "홈", icon: <Home size={22} />, path: "/" },
    {
      id: "status",
      label: "자산현황",
      icon: <PieChart size={22} />,
      path: "/status",
    },
    {
      id: "market",
      label: "시장",
      icon: <BarChart2 size={22} />,
      path: "/market",
    },
    {
      id: "chatbot",
      label: "챗봇",
      icon: <MessageSquare size={22} />,
      path: "/chatbot",
    },
    {
      id: "settings",
      label: "설정",
      icon: <Settings size={22} />,
      path: "/settings",
    },
  ];

  return (
    <div
      id="tour-bottom-nav"
      className="absolute bottom-0 left-0 right-0 bg-white shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.1)] rounded-t-[2.5rem] border-t border-gray-50 flex justify-around items-center px-4 py-3 pb-6 z-50"
    >
      <style>{`
        @keyframes pulse-highlight {
          0% { box-shadow: 0 0 0 0 rgba(0, 79, 254, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(0, 79, 254, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 79, 254, 0); }
        }
        .market-highlight {
          animation: pulse-highlight 2s infinite;
          background: rgba(0, 79, 254, 0.05);
          border-radius: 1rem;
        }
      `}</style>
      {tabs.map((tab) => {
        const active = isActive(tab.id);
        const isMarketHighlight = tab.id === "market" && shouldHighlightMarket;
        const isStatusHighlight = tab.id === "status" && shouldHighlightStatus;
        const isHighlight = isMarketHighlight || isStatusHighlight;

        return (
          <NavLink
            key={tab.id}
            to={tab.path}
            id={`tour-bottom-${tab.id}`}
            onClick={() => {
              if (tab.id === "market") handleMarketClick();
              if (tab.id === "status") handleStatusClick();
            }}
            className={`flex flex-col items-center space-y-1 transition-all duration-200 px-2 py-1 relative
              ${active ? "text-[#004FFE]" : "text-gray-400"}
              ${isHighlight ? "market-highlight" : ""}
            `}
          >
            <div className={`p-1 ${active ? "scale-110" : ""}`}>{tab.icon}</div>
            <span
              className={`text-[10px] font-bold ${active ? "opacity-100" : "opacity-80"}`}
            >
              {tab.label}
            </span>
            {active && (
              <div className="w-1 h-1 bg-[#004FFE] rounded-full mt-0.5"></div>
            )}
            {isHighlight && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
            )}
          </NavLink>
        );
      })}
    </div>
  );
};

export default BottomNav;
