import React, { useState } from 'react';
import { Check, ArrowLeft, HelpCircle } from 'lucide-react';

interface AccountOpeningProps {
  onBack: () => void;
  onNext: () => void;
  onShowGuide: () => void;
  onSkip: () => void;
  onNicknameChange: (name: string) => void;
}

const AccountOpening: React.FC<AccountOpeningProps> = ({ onBack, onNext, onShowGuide, onSkip, onNicknameChange }) => {
  const [nickname, setNickname] = useState('');

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    onNicknameChange(value);
  };

  return (
    <div className="flex flex-col h-full bg-white font-['Pretendard']">
      {/* Header */}
      <div className="flex items-center px-4 py-4">
        <button onClick={onBack} className="p-1">
          <ArrowLeft className="w-6 h-6 text-gray-400" />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-gray-800">증권계좌 개설하기</h1>
        <button onClick={onShowGuide} className="p-1">
          <HelpCircle className="w-6 h-6 text-primary/60" />
        </button>
      </div>

      {/* Hero Section */}
      <div className="px-6 py-6 border-b-[8px] border-gray-50">
        <div className="relative w-full aspect-[2/1] bg-gradient-to-br from-[#F0F9F6] to-[#E8F5F1] rounded-2xl overflow-hidden flex items-center px-6">
          {/* Placeholder for Squirrel Image */}
          <div className="flex-1 ml-auto text-right">
             <h2 className="text-xl font-bold text-gray-800 leading-tight">
                당신만의 증권계좌를<br />
                만들어보세요!
             </h2>
          </div>
          <div className="absolute left-6 top-1/2 -translate-y-1/2">
             <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md">
                <span className="text-4xl">🐿️</span>
             </div>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="px-6 py-8 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-800">닉네임 입력</span>
          </div>
          
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={nickname}
              onChange={(e) => handleNicknameChange(e.target.value)}
              placeholder="닉네임을 입력해 주세요."
              className="w-full bg-[#F8FBF9] border-none rounded-2xl py-4 pl-6 pr-12 text-lg font-medium text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
            <div className={`absolute right-4 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
              nickname.length > 0 ? 'bg-[#004FFE] shadow-sm' : 'bg-gray-200'
            }`}>
               <Check className={`w-4 h-4 text-white transition-opacity ${nickname.length > 0 ? 'opacity-100' : 'opacity-50'}`} />
            </div>
          </div>
        </div>

        {/* Benefits List */}
        <div className="space-y-3">
          {[
            '주식 1주 지급',
            '수수료 혜택 적용',
            '테스트 보상 지급',
            '계좌 개설 완료 보너스',
          ].map((benefit, idx) => (
            <div key={idx} className="flex items-center space-x-3">
              <Check className="w-5 h-5 text-primary" />
              <span className="text-gray-700 font-medium">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto px-6 pb-8">
        <p className="text-center text-xs text-gray-400 mb-6 font-medium">
          미동의 시 서비스 이용이 제한될 수 있습니다.
        </p>
        <button 
          onClick={onNext}
          className="w-full py-4 rounded-full bg-[#004FFE] text-white text-lg font-bold shadow-lg active:scale-[0.98] transition-all"
        >
          계좌 만들고 시작하기
        </button>
      </div>
    </div>
  );
};

export default AccountOpening;
