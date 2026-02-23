import React, { useState } from "react";
import { Check, ArrowLeft, HelpCircle } from "lucide-react";

interface AccountOpeningProps {
  onBack: () => void;
  onNext: () => void;
  onShowGuide: () => void;
  onSkip: () => void;
  onNicknameChange: (name: string) => void;
}

const AccountOpening: React.FC<AccountOpeningProps> = ({
  onBack,
  onNext,
  onShowGuide,
  onSkip,
  onNicknameChange,
}) => {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState(false);

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    if (value.trim().length > 0) {
      setError(false);
    }
    onNicknameChange(value);
  };

  const handleSubmit = () => {
    if (nickname.trim().length === 0) {
      setError(true);
      return;
    }
    onNext();
  };

  return (
    <div className="flex flex-col h-full bg-white font-['Pretendard']">
      {/* Header */}
      <div className="flex items-center px-4 py-4">
        <button onClick={onBack} className="p-1">
          <ArrowLeft className="w-6 h-6 text-gray-400" />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-gray-800">
          증권계좌 개설하기
        </h1>
        <button onClick={onShowGuide} className="p-1">
          <HelpCircle className="w-6 h-6 text-primary/60" />
        </button>
      </div>

      {/* Hero Section */}
      <div className="px-6 py-6 border-b-[8px] border-gray-50">
        <div className="w-full bg-[#e1eaf5] rounded-[2.5rem] px-6 flex items-center relative overflow-hidden shadow-sm shadow-blue-100/20 border border-blue-50/50 h-[170px]">
          {/* Owl Image: Absolute positioning to match TermsAgreement style */}
          <div className="absolute left-[10px] bottom-[-20px] w-[180px] z-10 animate-in slide-in-from-left duration-700">
            <img
              src="/owl1.png"
              className="w-full h-auto object-contain"
              alt="Account Owl"
            />
          </div>

          {/* Text Message: Positioned to the right */}
          <div className="ml-auto w-[55%] relative z-20 flex flex-col justify-center py-4">
            <h2 className="text-[1.2rem] font-black text-gray-800 leading-[1.5] tracking-tight text-right pr-2">
              당신만의 증권계좌를
              <br />
              <span className="text-[#004FFE]">만들어보세요!</span>
            </h2>
          </div>

          {/* Subtle decorations */}
          <div className="absolute top-[-10px] right-[-10px] w-20 h-20 bg-white/20 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Input Section */}
      <div className="px-6 py-8 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-gray-800">닉네임 입력</span>
          </div>

          <div className="relative flex flex-col space-y-2">
            <div className="relative flex items-center">
              <input
                type="text"
                value={nickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                placeholder="닉네임을 입력해 주세요."
                className={`w-full bg-[#F8FBF9] border-none rounded-2xl py-4 pl-6 pr-12 text-lg font-medium text-gray-800 placeholder:text-gray-400 focus:ring-2 transition-all outline-none ${
                  error
                    ? "ring-2 ring-red-500 bg-red-50/30"
                    : "focus:ring-primary/20"
                }`}
              />
              <div
                className={`absolute right-4 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                  nickname.length > 0 ? "bg-[#004FFE] shadow-sm" : "bg-gray-200"
                }`}
              >
                <Check
                  className={`w-4 h-4 text-white transition-opacity ${nickname.length > 0 ? "opacity-100" : "opacity-50"}`}
                />
              </div>
            </div>
            {error && (
              <span className="text-red-500 text-xs font-bold pl-2 animate-in fade-in slide-in-from-top-1 duration-200">
                닉네임을 입력해주세요
              </span>
            )}
          </div>
        </div>

        {/* Benefits List */}
        <div className="space-y-3">
          {[
            "해당 증권계좌는 가상의 계좌입니다!",
            "실제 계좌 개설 가이드는 상단 물음표를 눌러주세요!",
            "모의투자를 통해 투자 흐름을 익혀보세요.",
            "단계별 투자 학습이 제공됩니다.",
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
          onClick={handleSubmit}
          className="w-full py-4 rounded-full bg-[#004FFE] text-white text-lg font-bold shadow-lg active:scale-[0.98] transition-all"
        >
          계좌 만들고 시작하기
        </button>
      </div>
    </div>
  );
};

export default AccountOpening;
