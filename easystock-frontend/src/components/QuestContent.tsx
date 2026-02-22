import React, { useState, useEffect } from 'react';
import { CheckCircle2, ChevronRight, Lock, X, CheckSquare, Square } from 'lucide-react';

interface QuestItem {
  id: number;
  level: number;
  title: string;
  statusText: string;
  description: string;
  checklist: string[];
  status: 'completed' | 'in-progress' | 'locked';
}

const QuestContent: React.FC = () => {
  const [selectedQuest, setSelectedQuest] = useState<QuestItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // 튜토리얼 완료 여부에 따른 퀘스트 상태 동적 생성
  const [questList, setQuestList] = useState<QuestItem[]>([]);

  useEffect(() => {
    // 렌더링 시점에 최신 상태를 읽어옴
    const isTourDone = localStorage.getItem('app-tour-done') === 'true';
    
    const initialQuests: QuestItem[] = [
      {
        id: 1,
        level: 1,
        title: '네비게이션 바 마스터',
        statusText: isTourDone ? '미션 완료' : '진행중',
        description: '5개 메뉴 위치 파악',
        checklist: [],
        status: isTourDone ? 'completed' : 'in-progress',
      },
      {
        id: 2,
        level: 2,
        title: '홈화면 마스터',
        statusText: isTourDone ? '진행중' : '잠금됨',
        description: '홈 화면 위젯 및 콘텐츠 확인',
        checklist: ['자산현황 위젯 확인', '뉴스 3개 읽기', '인기 종목 확인', '랭킹 확인', '커뮤니티 글 1개 보기', '퀘스트 확인'],
        status: isTourDone ? 'in-progress' : 'locked',
      },
      {
        id: 3,
        level: 3,
        title: '시장 - 탐색하기',
        statusText: '잠금됨',
        description: '시장 동향 파악 및 관심 종목 등록',
        checklist: ['시장 메인 화면 이해', '시장동향 확인', '업종별 탐색', '관심 종목 5개 등록', '첫 투자 완료', '목표 수익률 설정 완료'],
        status: 'locked',
      },
      {
        id: 4,
        level: 4,
        title: '주식현황 - 보유종목',
        statusText: '잠금됨',
        description: '보유 종목 관리 및 용어 이해',
        checklist: ['보유 종목 확인', '관심 종목 1개 이상 구매', '각 용어 이해', '포트폴리오 차트 이해', '분산 투자 원칙 파악'],
        status: 'locked',
      },
      {
        id: 5,
        level: 5,
        title: '주식현황 - 포트폴리오 & AI',
        statusText: '잠금됨',
        description: '거래 내역 및 AI 조언 활용',
        checklist: ['거래내역 확인', '3가지 AI 특징 구분', 'AI 조언에 주식 1개 이상 매수/매도', '본인 투자 성향 파악'],
        status: 'locked',
      },
      {
        id: 6,
        level: 6,
        title: '시장 - 차트 & 호가창',
        statusText: '잠금됨',
        description: '종합 분석 및 전략적 거래',
        checklist: ['차트 패턴 구분 가능', '호가창 해석 가능', '뉴스 호재/악재 판단', 'AI 조언 활용', '4가지 종합 분석 가능', '익절/손절 라인 설정', '종합 분석 후 1회 거래 성공'],
        status: 'locked',
      },
    ];
    setQuestList(initialQuests);
  }, []);

  const openQuestDetail = (quest: QuestItem) => {
    if (quest.status === 'in-progress') {
      setSelectedQuest(quest);
      setIsModalOpen(true);
    }
  };

  const toggleCheck = (item: string) => {
    setCheckedItems(prev => ({ ...prev, [item]: !prev[item] }));
  };

  return (
    <div className="flex flex-col h-full bg-[#CFE3FA] rounded-t-[2.5rem] border border-white/50 shadow-inner overflow-hidden relative">
      <div className="p-5 pb-3">
        <div className="flex items-center justify-center">
          <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">퀘스트</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 hide-scrollbar space-y-4 pb-32 pt-2">
        {questList.map((quest) => (
          <div 
            key={quest.id}
            onClick={() => openQuestDetail(quest)}
            className={`relative overflow-hidden rounded-2xl border transition-all ${
              quest.status === 'in-progress' ? 'cursor-pointer active:scale-[0.98]' : ''
            } ${
              quest.status === 'completed' 
                ? 'bg-[#F5F8FF] border-[#DCE6F5] shadow-sm' 
                : quest.status === 'in-progress'
                ? 'bg-[#e1eaf5] border-[#3082F5] shadow-md'
                : 'bg-white/40 border-white/20 opacity-70 grayscale-[0.8]'
            }`}
          >
            <div className={`p-5 flex flex-col space-y-2 ${quest.status === 'in-progress' ? 'bg-white rounded-2xl m-[3.5px]' : ''}`}>
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
                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                    quest.status === 'completed' ? 'text-[#004FFE]' : 'text-gray-400'
                  }`}>
                    {quest.statusText}
                  </span>
                  <p className={`text-[11px] font-bold ${
                    quest.status === 'locked' ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {quest.description}
                  </p>
                </div>

                {quest.status === 'completed' ? (
                  <div className="bg-[#004FFE] text-white rounded-full p-1.5 shadow-sm">
                    <CheckCircle2 size={22} />
                  </div>
                ) : quest.status === 'in-progress' ? (
                  <div className="bg-[#004FFE] text-white text-[10px] font-black py-2 px-4 rounded-full flex items-center space-x-1 shadow-md">
                    <span>진행중</span>
                    <ChevronRight size={14} />
                  </div>
                ) : null}
              </div>
            </div>
            {quest.status === 'completed' && (
              <div className="absolute bottom-0 left-0 h-1 bg-[#004FFE] w-full opacity-30"></div>
            )}
          </div>
        ))}
      </div>

      {/* Checklist Modal */}
      {isModalOpen && selectedQuest && (
        <div className="absolute inset-0 z-50 flex items-end justify-center animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setIsModalOpen(false)} />
           <div className="w-full bg-white rounded-t-[3rem] p-8 shadow-2xl relative animate-in slide-in-from-bottom duration-500 max-h-[80%] flex flex-col">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-8 p-2 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="mb-6">
                <span className="text-[#004FFE] text-[11px] font-black tracking-widest uppercase mb-1 block">QUEST MISSION</span>
                <h3 className="text-2xl font-black text-gray-800 leading-tight">
                  Lv.{selectedQuest.level}<br/>{selectedQuest.title}
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                 {selectedQuest.checklist.map((item, idx) => (
                   <div 
                    key={idx} 
                    onClick={() => toggleCheck(item)}
                    className={`flex items-center p-4 rounded-2xl transition-all cursor-pointer border ${
                      checkedItems[item] 
                        ? 'bg-[#F0F7FF] border-[#004FFE]/20 text-[#004FFE]' 
                        : 'bg-gray-50 border-gray-100 text-gray-600'
                    }`}
                   >
                     {checkedItems[item] ? (
                       <CheckSquare className="w-6 h-6 mr-3 shrink-0" />
                     ) : (
                       <Square className="w-6 h-6 mr-3 shrink-0 text-gray-200" />
                     )}
                     <span className="font-bold text-sm tracking-tight">{item}</span>
                   </div>
                 ))}
                 {selectedQuest.checklist.length === 0 && (
                   <p className="text-center text-gray-400 font-bold py-10">이 미션은 세부 항목이 없습니다.</p>
                 )}
              </div>

              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-full mt-6 py-4 bg-[#004FFE] text-white rounded-full font-black text-lg shadow-lg shadow-[#004FFE]/20 active:scale-95 transition-all"
              >
                확인
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default QuestContent;
