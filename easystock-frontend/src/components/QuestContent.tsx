
import React from 'react';
import { CheckCircle2, ChevronRight, Lock } from 'lucide-react';

interface QuestItem {
  id: number;
  level: number;
  title: string;
  statusText: string;
  description: string;
  status: 'completed' | 'in-progress' | 'locked';
}

const quests: QuestItem[] = [
  {
    id: 1,
    level: 1,
    title: '첫 걸음 떼기',
    statusText: '미션 완료',
    description: '생애 첫 주식 1주 매수하기',
    status: 'completed',
  },
  {
    id: 2,
    level: 2,
    title: '수익의 기쁨',
    statusText: '미션 완료',
    description: '단일종목 수익률 +1.0% 달성',
    status: 'completed',
  },
  {
    id: 3,
    level: 3,
    title: '손절의 아픔',
    statusText: '미션 도전',
    description: '단일종목 손실률 -1.0% 기록',
    status: 'in-progress',
  },
  {
    id: 4,
    level: 4,
    title: '분산의 지혜',
    statusText: '잠금됨',
    description: '서로 다른 섹터 주식 3개 보유하기',
    status: 'locked',
  },
  {
    id: 5,
    level: 5,
    title: '지식의 힘',
    statusText: '잠금됨',
    description: '오늘의 뉴스 10개 이상 읽기',
    status: 'locked',
  },
  {
    id: 6,
    level: 6,
    title: '꾸준함의 보상',
    statusText: '잠금됨',
    description: '1주일 연속 앱 출석 체크하기',
    status: 'locked',
  },
];

const QuestContent: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#E8F3EF] rounded-t-[2.5rem] border border-white/50 shadow-inner overflow-hidden">
      {/* Sticky Header inside component */}
      <div className="p-5 pb-3">
        <div className="flex items-center space-x-2 ml-1">
          {/* Icon removed as requested */}
          <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">퀘스트</h2>
        </div>
      </div>

      {/* Scrollable Quest Area */}
      <div className="flex-1 overflow-y-auto px-5 hide-scrollbar space-y-4 pb-32 pt-2">
        {quests.map((quest) => (
          <div 
            key={quest.id}
            className={`relative overflow-hidden rounded-2xl border transition-all ${
              quest.status === 'completed' 
                ? 'bg-[#F0F9F6] border-[#D1E9E0] shadow-sm' 
                : quest.status === 'in-progress'
                ? 'bg-white border-[#FDE68A] shadow-md ring-1 ring-[#FDE68A]/50'
                : 'bg-white/50 border-gray-100 opacity-70 grayscale-[0.5]'
            }`}
          >
            {/* "COMPLETE" Ribbon for completed tasks */}
            {quest.status === 'completed' && (
              <div className="absolute top-0 right-0 overflow-hidden w-20 h-20">
                <div className="absolute top-3 right-[-30px] bg-[#4B8ED1] text-white text-[9px] font-bold py-1 px-10 rotate-45 text-center shadow-sm">
                  COMPLETE
                </div>
              </div>
            )}

            <div className="p-5 flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <span className={`text-lg font-extrabold ${
                  quest.status === 'locked' ? 'text-gray-400' : 'text-gray-800'
                }`}>
                  Lv.{quest.level} {quest.title}
                </span>
                {quest.status === 'locked' && <Lock size={14} className="text-gray-300" />}
              </div>

              <div className="flex justify-between items-end">
                <div className="flex flex-col space-y-1">
                  <span className={`text-xs font-bold ${
                    quest.status === 'completed' ? 'text-[#2D8C69]' : 'text-gray-400'
                  }`}>
                    {quest.statusText}
                  </span>
                  <p className={`text-[11px] font-medium ${
                    quest.status === 'locked' ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {quest.description}
                  </p>
                </div>

                {/* Status Indicator (Icon or Button) */}
                {quest.status === 'completed' ? (
                  <div className="bg-[#2D8C69] text-white rounded-full p-1 shadow-sm">
                    <CheckCircle2 size={24} />
                  </div>
                ) : quest.status === 'in-progress' ? (
                  <button className="bg-[#2D8C69] text-white text-[11px] font-bold py-2 px-4 rounded-full flex items-center space-x-1 shadow-md hover:bg-[#247054] transition-colors">
                    <span>진행중</span>
                    <ChevronRight size={14} />
                  </button>
                ) : null}
              </div>
            </div>
            
            {/* Progress bar decoration for completed items */}
            {quest.status === 'completed' && (
              <div className="absolute bottom-0 left-0 h-1 bg-[#2D8C69] w-full opacity-30"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestContent;
