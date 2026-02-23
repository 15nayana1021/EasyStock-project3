import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { X, ChevronRight } from "lucide-react";

interface TourStep {
  targetId: string;
  title: string;
  description: string;
  illustration: string;
  viewRequired?: "select" | "chat";
}

interface ChatTourProps {
  onComplete: () => void;
  isChatStep: boolean;
  onForceChatView: () => void;
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: "chat-tour-intro",
    title: "#1 페이지 소개",
    description:
      "여기는 ‘챗봇' 페이지야!\n네가 궁금해 하는 것들을 네가 원하는 성향의 에이전트 캐릭터들을 골라서 채팅할 수가 있어!",
    illustration: "🦉",
    viewRequired: "select",
  },
  {
    targetId: "chat-tour-select",
    title: "#2 캐릭터 선택창",
    description:
      "하나의 에이전트 캐릭터만 선택해도 되고, 원한다면 여러 명을 선택할 수 있어. 캐릭터를 선택한 후에 ‘선택완료’를 눌러봐 봐!",
    illustration: "🐿️",
    viewRequired: "select",
  },
  {
    targetId: "chat-tour-input",
    title: "#3 채팅창",
    description:
      "여기서 네가 궁금한 거나 알고 싶은 것을 편하게 물어봐줘! 우리가 너를 위해 친절히 답을 해줄게",
    illustration: "🦉",
    viewRequired: "chat",
  },
];

const ChatTour: React.FC<ChatTourProps> = ({
  onComplete,
  isChatStep,
  onForceChatView,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const currentStep = TOUR_STEPS[currentStepIdx];

  const updateTargetPosition = () => {
    const element = document.getElementById(currentStep.targetId);
    if (element) {
      setTargetRect(element.getBoundingClientRect());
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    // If we transition to Step 3 but we are still in selection mode,
    // we don't show the tour until the user clicks and switches view
    if (currentStep.viewRequired === "chat" && !isChatStep) {
      setIsVisible(false);
      return;
    }

    let retryCount = 0;
    const maxRetries = 20;

    const attemptUpdate = () => {
      const element = document.getElementById(currentStep.targetId);
      if (element) {
        updateTargetPosition();
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(attemptUpdate, 100);
      } else {
        setIsVisible(false);
      }
    };

    attemptUpdate();
    window.addEventListener("resize", updateTargetPosition);
    return () => {
      window.removeEventListener("resize", updateTargetPosition);
    };
  }, [currentStepIdx, isChatStep]);

  const handleNext = () => {
    if (currentStepIdx < TOUR_STEPS.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  // Skip logic: if we are on step 2 and user clicks handleStartChat in main component,
  // they might expect the tour to follow. handled via useEffect on isChatStep above.

  if (!targetRect || !isVisible) return null;

  const getPopupPosition = () => {
    const commonStyles = {
      width: "min(calc(100vw - 40px), 320px)",
      maxHeight: "calc(100vh - 40px)",
      overflowY: "auto" as const,
    };

    const centerY = targetRect.top + targetRect.height / 2;
    // For vertical elements, we decide whether to show above or below
    const isBottomHalf = targetRect.top > window.innerHeight / 2;

    // Improved vertical positioning with boundary clamping
    let top: string = "auto";
    let bottom: string = "auto";
    let transform: string = "translateX(-50%)";

    if (isBottomHalf) {
      // Show ABOVE the target
      bottom = `${window.innerHeight - targetRect.top + 20}px`;
      // Clamp to top margin
      if (parseInt(bottom) > window.innerHeight - 60) {
        bottom = "auto";
        top = "20px";
        transform = "translateX(-50%)";
      }
    } else {
      // Show BELOW the target
      top = `${targetRect.bottom + 20}px`;
      // Clamp to bottom margin
      if (parseInt(top) > window.innerHeight - 60) {
        top = "auto";
        bottom = "20px";
        transform = "translateX(-50%)";
      }
    }

    return {
      ...commonStyles,
      top,
      bottom,
      left: "50%",
      transform,
    };
  };

  const popupPosition = getPopupPosition();

  return (
    <div className="fixed inset-0 z-[100] animate-in fade-in duration-500">
      {/* Overlay Mask */}
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

      {/* Highlight Border */}
      <div
        className="absolute transition-all duration-300 pointer-events-none rounded-2xl border-[3px] border-primary shadow-[0_0_20px_rgba(45,140,105,0.6)]"
        style={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
        }}
      />

      {/* Guide Popup */}
      <div
        className="absolute bg-white rounded-[2.5rem] p-6 shadow-2xl flex flex-col items-center text-center transition-all duration-300 scrollbar-hide"
        style={popupPosition as any}
      >
        <button
          onClick={onComplete}
          className="absolute top-6 right-6 text-gray-300 hover:text-gray-500"
        >
          <X className="w-5 h-5" />
        </button>

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
          CHATBOT GUIDE
        </span>

        <h3 className="text-[19px] font-black text-[#1A334E] mb-2 leading-tight">
          {currentStep.title}
        </h3>

        <p className="text-[14px] font-bold text-gray-400 mb-8 leading-relaxed whitespace-pre-wrap">
          {currentStep.description}
        </p>

        <div className="w-full flex space-x-3">
          <button
            onClick={onComplete}
            className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-full font-black text-[16px] active:scale-95 transition-all"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="flex-2 py-4 bg-[#004FFE] text-white rounded-full font-black text-[16px] shadow-lg shadow-[#004FFE]/20 active:scale-95 transition-all flex items-center justify-center group"
          >
            <span>
              {currentStepIdx === TOUR_STEPS.length - 1 ? "시작하기" : "다음"}
            </span>
            <ChevronRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatTour;
