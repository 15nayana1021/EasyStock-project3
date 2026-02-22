import React, { useState, useEffect } from 'react';
import { Check, ChevronRight, ArrowLeft } from 'lucide-react';

interface TermsAgreementProps {
  onNext: () => void;
  onSkip: () => void;
}

const TermsAgreement: React.FC<TermsAgreementProps> = ({ onNext, onSkip }) => {
  const [agreements, setAgreements] = useState({
    all: false,
    guide: false,
    privacy: false,
    marketing1: false,
    marketing2: false,
  });

  const toggleAll = () => {
    const newValue = !agreements.all;
    setAgreements({
      all: newValue,
      guide: newValue,
      privacy: newValue,
      marketing1: newValue,
      marketing2: newValue,
    });
  };

  const toggleItem = (key: keyof typeof agreements) => {
    if (key === 'all') return;
    const newAgreements = { ...agreements, [key]: !agreements[key] };
    const allChecked = newAgreements.guide && newAgreements.privacy && newAgreements.marketing1 && newAgreements.marketing2;
    setAgreements({ ...newAgreements, all: allChecked });
  };

  const canProceed = agreements.guide && agreements.privacy;

  return (
    <div className="flex flex-col h-full bg-white font-['Pretendard']">
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-gray-50">
        <ArrowLeft className="w-6 h-6 text-gray-400" />
        <h1 className="flex-1 text-center text-lg font-bold text-gray-800">이용약관 동의</h1>
        <div className="w-6"></div>
      </div>

      {/* Hero Section */}
      <div className="px-6 py-8 flex flex-col items-center">
        <div className="relative w-full max-w-[280px] aspect-[4/3] bg-[#E8F5F1] rounded-2xl overflow-hidden flex items-center justify-center mb-6">
          {/* Placeholder for Owl Image */}
          <div className="text-center p-4">
             <div className="w-28 h-28 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-3 shadow-md overflow-hidden border-2 border-primary/5">
                <img src="/Mentor_Owl.png" className="w-full h-full object-contain p-2" alt="Mentor Owl" />
             </div>
             <h2 className="text-xl font-bold text-gray-800 leading-tight">
                서비스 이용을 위해<br />
                약관에 동의해주세요!
             </h2>
          </div>
          <div className="absolute top-4 right-4 bg-white/80 p-1.5 rounded-lg">
             <Check className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* Agreements List */}
        <div className="w-full space-y-4">
          {/* Select All */}
          <div 
            onClick={toggleAll}
            className="flex items-center p-4 bg-[#F8FBF9] rounded-xl cursor-pointer border border-transparent hover:border-primary/20 transition-all"
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${agreements.all ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
              <Check className="w-4 h-4" />
            </div>
            <span className="ml-3 font-bold text-gray-800">전체 동의</span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { key: 'guide', label: '투자 가이드 서비스 이용약관', required: true, desc: '부엉이 선생님이 알려주는 투자 가이드 이용약관' },
              { key: 'privacy', label: '개인정보 수집 및 이용 동의', required: true, desc: '투자 알림 및 서비스 제공을 위한 개인정보 수집' },
              { key: 'marketing1', label: '광고성 정보 수신 동의', required: false, desc: '맞춤 혜택 및 이벤트 정보 수신' },
              { key: 'marketing2', label: '광고성 정보 수신 동의', required: false, desc: '맞춤 혜택 및 이벤트 정보 수신' },
            ].map((item) => (
              <div key={item.key} className="flex flex-col space-y-1">
                <div className="flex items-center group cursor-pointer" onClick={() => toggleItem(item.key as keyof typeof agreements)}>
                   <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${agreements[item.key as keyof typeof agreements] ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="ml-3 flex-1">
                    <span className="text-gray-800 font-medium">
                      {item.label} <span className={item.required ? "text-primary/70" : "text-gray-400"}>({item.required ? '필수' : '선택'})</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between ml-9">
                   <span className="text-xs text-gray-400">{item.desc}</span>
                   <button className="flex items-center text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md hover:bg-gray-200 transition-colors">
                      내용보기 <ChevronRight className="w-3 h-3 ml-0.5" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto px-6 pb-8">
        <p className="text-center text-[10px] text-gray-400 mb-6">
          미동의 시 서비스 이용이 제한될 수 있습니다.
        </p>
        <button 
          onClick={() => canProceed && onNext()}
          disabled={!canProceed}
          className={`w-full py-4 rounded-full text-lg font-bold transition-all shadow-lg ${
            canProceed 
            ? 'bg-[#004FFE] text-white active:scale-[0.98]' 
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          동의하고 시작하기
        </button>
      </div>
    </div>
  );
};

export default TermsAgreement;
