import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { X, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TourStep {
  targetId: string;
  title: string;
  description: string;
  illustration: string;
  path?: string; // Optional path to navigate to
}

interface AppTourProps {
  onComplete: () => void;
  userName: string;
}

const TOUR_STEPS: TourStep[] = [
  // Welcome Steps
  {
    targetId: "center",
    title: "#1 환영 튜토리얼",
    description:
      "어서 와, {userName} 친구! 투자학교에 온 걸 환영해🖐️ 나는 부엉이 선생님이야.\n우리 재미있게 투자를 배워보자! 실수해도 괜찮아. 배우는 중이니까! 자, 시작해볼까?",
    illustration: "🦉",
    path: "/assets",
  },
  {
    targetId: "tour-sidebar",
    title: "#2 메뉴바 전체 소개",
    description:
      "왼쪽 메뉴를 보면 6개 탭이 있어!\n필요할 때마다 눌러서 확인할 수 있지.\n하나씩 알려줄게!",
    illustration: "🐿️",
    path: "/assets",
  },
  // Sidebar (6 icons)
  {
    targetId: "tour-sidebar-assets",
    title: "#3 나의 자산 현황",
    description:
      '여기서 네 총 자산을 볼 수 있어!​ \n"나의 자산 현황 = 현금 + 주식 가치"로, ​\n이 숫자를 올라가게 해야 해.​ \n투자를 잘하면 이 숫자가 쑥쑥 올라갈 거야!',
    illustration: "🦉",
    path: "/assets",
  },
  {
    targetId: "tour-sidebar-news",
    title: "#4 뉴스 (1/2)",
    description:
      "주식 가격에 영향을 주는 중요한 정보들이니까 투자하기 전에 꼭 확인해야 해!​\n뉴스에 나오는 회사들을 주목해서 봐!",
    illustration: "🐿️",
    path: "/news",
  },
  {
    targetId: "tour-sidebar-news",
    title: "#5 뉴스 (2/2)",
    description:
      "뉴스를 볼 때는 호재인지 악재인지 확인해야 해 \n- 호재 : 주가를 올릴 좋은 소식\n(성공, 증가, 출시 등) \n- 악재 : 주가를 떨어뜨릴 나쁜 소식\n(적자, 감소, 문제 등)",
    illustration: "🐿️",
    path: "/news",
  },
  {
    targetId: "tour-sidebar-popular",
    title: "#6 인기",
    description:
      "인기 종목에서는 어떤 주식이 인기 있는지 볼 수 있어. 다른 투자자들이 많이 사는 주식을 확인해보자!​\n⚠️주의할 점 : 인기⬆️ ≠ 사야됨이 아냐",
    illustration: "🦉",
    path: "/",
  },
  {
    targetId: "tour-sidebar-ranking",
    title: "#7 랭킹​",
    description:
      "랭킹에서는 다른 다람쥐 친구들과 보유자산과 수익률로, 누가 투자를 잘하는지 확인할 수 있어!​ 저 위까지 올라가보자🚀",
    illustration: "🐿️",
    path: "/ranking",
  },
  {
    targetId: "tour-sidebar-community",
    title: "#8 커뮤니티",
    description:
      "커뮤니티에서는 다른 동물 친구들과 주식과 관련된 이야기를 나눌 수 있어. 투자 팁도 공유하고 함께 배워보자!",
    illustration: "🦉",
    path: "/community",
  },
  {
    targetId: "tour-sidebar-quest",
    title: "#9 퀘스트",
    description:
      "퀘스트는 미션을 확인하는 곳으로, 미션을 완료하고 퀴즈를 맞추면 레벨이 오를 수 있어.​ 경험치도 쌓고 레벨도 올려서 너가 볼 수 없는 곳들도 열어보자!",
    illustration: "🐿️",
    path: "/quest",
  },
  {
    targetId: "tour-bottom-nav",
    title: "#10 하단 메뉴바 소개",
    description:
      "아래 메뉴를 보면 5개 탭이 있어!​ 필요할 때마다 눌러서 이동할 수 있지.​ 하나씩 알려줄게!",
    illustration: "🦉",
    path: "/",
  },
  // Bottom Nav (5 icons)
  {
    targetId: "tour-bottom-home",
    title: "#11 홈",
    description:
      "홈은 지금 보고 있는 화면이야!​ 투자의 도움 되는 것들을 모아둔 곳이지.​ 아마 가장 많이 들어오는 화면이 될거야.",
    illustration: "🦉",
    path: "/",
  },
  {
    targetId: "tour-bottom-status",
    title: "#12 주식 현황",
    description:
      "내 주식 현황은 네가 산 주식들을 자세히 볼 수 있어.​ 얼마나 벌었는지도 여기서 확인하고, ai한테 내 포트폴리오에 대한 조언도 받을 수 있어.",
    illustration: "🐿️",
    path: "/status",
  },
  {
    targetId: "tour-bottom-market",
    title: "#13 시장",
    description:
      "시장은 주식을 사고팔 수 있는 곳이야.​ 새로운 투자 기회를 찾아보자!",
    illustration: "🦉",
    path: "/market",
  },
  {
    targetId: "tour-bottom-chatbot",
    title: "#14 챗봇",
    description:
      "나랑 여우 에이전트들과 채팅할 수 있는 공간으로, 모르는 용어와 궁금한 것들을 편하게 물어볼 수 있어! 언제든지 찾아와줘",
    illustration: "🐿️",
    path: "/chatbot",
  },
  {
    targetId: "tour-bottom-settings",
    title: "#15 설정",
    description: "설정은 언어를 바꾸거나,​ 알림이나 계정 정보를 관리해!",
    illustration: "🦉",
    path: "/settings",
  },
  {
    targetId: "tour-bottom-market",
    title: "#16 홈화면 설명 끝",
    description:
      "나의 설명은 끝났어! 이제 본격적인 투자 공부를 위해 하단의 '시장' 탭을 바로 눌러볼까?",
    illustration: "🦉",
  }, // path removed to force manual click
];

const AppTour: React.FC<AppTourProps> = ({ onComplete, userName }) => {
  const navigate = useNavigate();
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const currentStep = TOUR_STEPS[currentStepIdx];

  const updateTargetPosition = () => {
    if (currentStep.targetId === "center") {
      setTargetRect(null);
      setIsVisible(true);
      return;
    }

    const element = document.getElementById(currentStep.targetId);
    if (element) {
      setTargetRect(element.getBoundingClientRect());
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    if (currentStep.path) {
      navigate(currentStep.path);
    }
  }, [currentStepIdx, currentStep.path, navigate]);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 20; // 최대 2초 (100ms * 20)

    const attemptUpdate = () => {
      if (currentStep.targetId === "center") {
        updateTargetPosition();
        return;
      }

      const element = document.getElementById(currentStep.targetId);
      if (element) {
        updateTargetPosition();
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(attemptUpdate, 100);
      } else {
        // If max retries reached and element not found, hide the tour for this step
        setIsVisible(false);
      }
    };

    attemptUpdate();
    window.addEventListener("resize", updateTargetPosition);
    return () => {
      window.removeEventListener("resize", updateTargetPosition);
    };
  }, [currentStepIdx]);

  // isVisible만 체크하도록 수정 (targetRect는 center일 때 null일 수 있음)
  if (!isVisible) return null;

  const handleNext = () => {
    if (currentStepIdx < TOUR_STEPS.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    } else {
      localStorage.setItem("app-tour-done", "true");
      localStorage.setItem("market-tour-done", "true");
      localStorage.setItem("status-tour-done", "true");
      localStorage.removeItem("market-highlight-pending");
      localStorage.removeItem("status-highlight-pending");
      window.dispatchEvent(new Event("check-market-highlight"));
      window.dispatchEvent(new Event("check-status-highlight"));
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  // Calculate position for the popup
  const getPopupPosition = () => {
    const commonStyles = {
      maxHeight: "calc(100vh - 40px)",
      overflowY: "auto" as const,
      width: "min(calc(100vw - 40px), 320px)",
    };

    if (!targetRect) {
      return {
        ...commonStyles,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    // Sidebar items (#2-9)
    if (currentStep.targetId.startsWith("tour-sidebar")) {
      const centerY = targetRect.top + targetRect.height / 2;

      // Increased threshold to account for taller popups
      const threshold = 220;
      const isTopHeavy = centerY < threshold;
      const isBottomHeavy = centerY > window.innerHeight - threshold;

      return {
        ...commonStyles,
        top: isTopHeavy ? "20px" : isBottomHeavy ? "auto" : `${centerY}px`,
        bottom: isBottomHeavy ? "20px" : "auto",
        left: `${targetRect.right + 20}px`,
        transform: isTopHeavy || isBottomHeavy ? "none" : "translateY(-50%)",
        width: "min(calc(100vw - 120px), 320px)",
      };
    }

    // Bottom nav or other items (Step #11-15)
    const isBottomHalf = targetRect.top > window.innerHeight / 2;
    return {
      ...commonStyles,
      top: isBottomHalf ? "auto" : `${targetRect.bottom + 20}px`,
      bottom: isBottomHalf
        ? `${window.innerHeight - targetRect.top + 20}px`
        : "auto",
      left: "50%",
      transform: "translateX(-50%)",
    };
  };

  const popupPosition = getPopupPosition();

  return (
    <div className="fixed inset-0 z-[100] animate-in fade-in duration-500">
      {/* Overlay Mask */}
      {targetRect ? (
        <div
          className="absolute inset-0 bg-black/60"
          style={{
            clipPath: `polygon(
              0% 0%, 
              0% 100%, 
              ${targetRect.left}px 100%, 
              ${targetRect.left}px ${targetRect.top}px, 
              ${targetRect.right}px ${targetRect.top}px, 
              ${targetRect.right}px ${targetRect.bottom}px, 
              ${targetRect.left}px ${targetRect.bottom}px, 
              ${targetRect.left}px 100%, 
              100% 100%, 
              100% 0%
            )`,
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/60" />
      )}

      {/* Highlight Border */}
      {targetRect && (
        <div
          className="absolute transition-all duration-300 pointer-events-none rounded-2xl border-[3px] border-primary shadow-[0_0_20px_rgba(45,140,105,0.6)]"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      {/* Guide Popup */}
      <div
        className="absolute bg-white rounded-[2.5rem] p-6 shadow-2xl flex flex-col items-center text-center transition-all duration-300 scrollbar-hide overflow-visible"
        style={popupPosition as any}
      >
        <div className="absolute top-6 right-6 z-[100] flex flex-col items-end">
          <button
            onClick={() => {
              localStorage.setItem("app-tour-done", "true");
              localStorage.setItem("market-tour-done", "true");
              localStorage.setItem("status-tour-done", "true");
              localStorage.removeItem("market-highlight-pending");
              localStorage.removeItem("status-highlight-pending");
              window.dispatchEvent(new Event("check-market-highlight"));
              window.dispatchEvent(new Event("check-status-highlight"));
              onComplete();
            }}
            className="text-gray-300 hover:text-gray-500 p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {currentStepIdx === 0 && (
            <div className="relative mt-2 animate-bounce">
              <div className="absolute -top-1.5 right-2.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-[#004FFE]"></div>
              <div className="bg-[#004FFE] text-white text-[11px] px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap font-black border border-white/10">
                Skip 버튼!
              </div>
            </div>
          )}
        </div>

        <div className="relative mb-6">
          <div className="w-32 h-32 bg-[#F0F9F6] rounded-[2.5rem] flex items-center justify-center shadow-md border-4 border-white overflow-hidden">
            <img
              src="/Mentor_Owl.png"
              className="w-full h-full object-contain p-2"
              alt="Mentor Owl"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-[#004FFE] text-white text-[11px] font-black px-3 py-1 rounded-full border-2 border-white shadow-sm">
            {currentStepIdx + 1} / {TOUR_STEPS.length}
          </div>
        </div>

        <span className="text-primary text-[11px] font-black tracking-widest uppercase mb-2 bg-primary/5 px-3 py-1 rounded-full">
          APP TOUR GUIDE
        </span>

        <h3 className="text-[19px] font-black text-[#1A334E] mb-2 leading-tight">
          {currentStep.title}
        </h3>

        <p className="text-[14px] font-bold text-gray-400 mb-8 leading-relaxed whitespace-pre-wrap">
          {currentStep.description.replace("{userName}", userName)}
        </p>

        <div className="w-full flex space-x-3">
          <button
            onClick={handleBack}
            disabled={currentStepIdx === 0}
            className={`flex-1 py-4 rounded-full font-black text-[16px] active:scale-95 transition-all ${
              currentStepIdx === 0
                ? "bg-gray-50 text-gray-200 cursor-not-allowed"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            }`}
          >
            뒤로
          </button>
          <button
            onClick={handleNext}
            className="flex-2 py-4 bg-[#004FFE] text-white rounded-full font-black text-[16px] shadow-lg shadow-[#004FFE]/20 active:scale-95 transition-all flex items-center justify-center group"
          >
            <span>
              {currentStepIdx === TOUR_STEPS.length - 1 ? "완료" : "다음"}
            </span>
            <ChevronRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppTour;
