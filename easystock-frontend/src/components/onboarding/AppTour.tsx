import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { X, ChevronRight } from 'lucide-react';

interface TourStep {
  targetId: string;
  title: string;
  description: string;
  illustration: string;
}

interface AppTourProps {
  onComplete: () => void;
}

const TOUR_STEPS: TourStep[] = [
  // Sidebar (6 icons)
  { targetId: 'tour-sidebar-assets', title: '#1 자산 현황', description: '내 전체 자산 정보를 한눈에 확인할 수 있어요.', illustration: '🦉' },
  { targetId: 'tour-sidebar-news', title: '#2 실시간 뉴스', description: '시장의 최신 뉴스를 빠르게 받아보세요.', illustration: '🐿️' },
  { targetId: 'tour-sidebar-popular', title: '#3 인기 종목', description: '지금 사람들이 가장 많이 찾는 종목들이에요.', illustration: '🦉' },
  { targetId: 'tour-sidebar-ranking', title: '#4 투자 랭킹', description: '다른 투자자들의 순위를 확인하고 경쟁해보세요.', illustration: '🐿️' },
  { targetId: 'tour-sidebar-community', title: '#5 커뮤니티', description: '다른 분들과 투자 정보를 자유롭게 공유해보세요.', illustration: '🦉' },
  { targetId: 'tour-sidebar-quest', title: '#6 오늘의 퀘스트', description: '매일 주어지는 미션을 완료하고 보상을 받아보세요.', illustration: '🐿️' },
  // Bottom Nav (5 icons)
  { targetId: 'tour-bottom-home', title: '#7 홈 화면', description: '메인 화면으로 언제든지 돌아올 수 있어요.', illustration: '🦉' },
  { targetId: 'tour-bottom-status', title: '#8 주식 현황', description: '내 보유 주식의 실시간 상세 현황을 확인하세요.', illustration: '🐿️' },
  { targetId: 'tour-bottom-market', title: '#9 시장 분석', description: '상세한 시장 지표와 차트를 분석해보세요.', illustration: '🦉' },
  { targetId: 'tour-bottom-chatbot', title: '#10 투자 챗봇', description: '부엉이 선생님에게 무엇이든 물어보세요!', illustration: '🐿️' },
  { targetId: 'tour-bottom-settings', title: '#11 설정', description: '알림 설정 및 내 정보를 관리할 수 있어요.', illustration: '🦉' },
];

const AppTour: React.FC<AppTourProps> = ({ onComplete }) => {
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
    let retryCount = 0;
    const maxRetries = 20; // 최대 2초 (100ms * 20)

    const attemptUpdate = () => {
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
    window.addEventListener('resize', updateTargetPosition);
    return () => {
      window.removeEventListener('resize', updateTargetPosition);
    };
  }, [currentStepIdx]);

  // targetRect가 없어도 컴포넌트 자체를 유지하여 재시도 로직이 계속 돌 수 있게 함
  if (!isVisible || !targetRect) return null;

  const handleNext = () => {
    if (currentStepIdx < TOUR_STEPS.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    } else {
      localStorage.setItem('app-tour-done', 'true');
      onComplete();
    }
  };

  if (!targetRect || !isVisible) return null;

  // Calculate position for the popup
  const popupPosition = {
    top: targetRect.top > window.innerHeight / 2 ? 'auto' : `${targetRect.bottom + 20}px`,
    bottom: targetRect.top > window.innerHeight / 2 ? `${window.innerHeight - targetRect.top + 20}px` : 'auto',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'min(calc(100vw - 40px), 320px)'
  };

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
          )`
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
      >
         <div className="absolute -top-6 -right-6 animate-bounce">
            <span className="text-2xl">🌱</span>
         </div>
      </div>

      {/* Guide Popup */}
      <div 
        className="absolute bg-white rounded-[2.5rem] p-6 shadow-2xl flex flex-col items-center text-center transition-all duration-300"
        style={popupPosition as any}
      >
        <button onClick={onComplete} className="absolute top-6 right-6 text-gray-300 hover:text-gray-500">
          <X className="w-5 h-5" />
        </button>

        <div className="relative mb-6">
           <div className="w-32 h-32 bg-[#F0F9F6] rounded-[2.5rem] flex items-center justify-center shadow-md border-4 border-white overflow-hidden">
              <img src="/Mentor_Owl.png" className="w-full h-full object-contain p-2" alt="Mentor Owl" />
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
            <span>{currentStepIdx === TOUR_STEPS.length - 1 ? '시작하기' : '다음'}</span>
            <ChevronRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppTour;
