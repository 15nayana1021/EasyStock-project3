import React from "react";
import { Check, ArrowLeft } from "lucide-react";

interface AccountGuideProps {
  onBack: () => void;
}

const AccountGuide: React.FC<AccountGuideProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col h-full bg-white font-['Pretendard']">
      {/* Header */}
      <div className="flex items-center px-4 py-4">
        <button onClick={onBack} className="p-1">
          <ArrowLeft className="w-6 h-6 text-gray-400" />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-gray-800 pr-8">
          실전 계좌 개설 가이드
        </h1>
      </div>

      {/* Hero Section */}
      <div className="px-6 py-6 border-b-[8px] border-gray-50">
        <div className="w-full bg-[#e1eaf5] rounded-[2.5rem] px-6 flex items-center relative overflow-hidden shadow-sm shadow-blue-100/20 border border-blue-50/50 h-[170px]">
          {/* Owl Image: Absolute positioning for consistency */}
          <div className="absolute left-[10px] bottom-[-20px] w-[180px] z-10 animate-in slide-in-from-left duration-700">
            <img
              src="/owl2.png"
              className="w-full h-auto object-contain"
              alt="Guide Owl"
            />
          </div>

          {/* Text Message: Positioned to the right */}
          <div className="ml-auto w-[65%] relative z-20 flex flex-col justify-center py-4">
            <h2 className="text-[1.2rem] font-black text-gray-800 leading-[1.5] tracking-tight text-right pr-2">
              실제 증권계좌 개설은
              <br />
              <span className="text-[#004FFE]">이렇게 진행돼요!</span>
            </h2>
          </div>

          {/* Subtle decorations */}
          <div className="absolute top-[-10px] right-[-10px] w-20 h-20 bg-white/20 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Guide Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10">
        {/* Step 1: Requirements */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-primary/20 rounded-md flex items-center justify-center text-primary">
              <Check className="w-4 h-4" />
            </div>
            <span className="font-bold text-gray-800 text-lg">필수 준비물</span>
          </div>

          <div className="space-y-2 pl-2 border-l-2 border-primary/10 ml-3">
            {[
              "신분증 (주민등록증 또는 운전면허증)",
              "본인 명의 스마트폰",
              "본인 명의 은행 계좌",
            ].map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                <span className="text-gray-700 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: Steps */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-primary/20 rounded-md flex items-center justify-center text-primary">
              <Check className="w-4 h-4" />
            </div>
            <span className="font-bold text-gray-800 text-lg">
              계좌 개설 단계
            </span>
          </div>

          <div className="space-y-4 mt-2">
            {[
              { label: "증권사 앱 설치", desc: null },
              { label: "본인 인증 진행", desc: "휴대폰 SMS 인증 등" },
              { label: "신분증 촬영", desc: null },
              { label: "기존 계좌 인증", desc: "1원 입금 확인" },
              { label: "비밀번호 설정", desc: null },
              { label: "계좌 개설 완료", desc: null },
            ].map((step, idx) => (
              <div key={idx} className="flex items-start space-x-3">
                <div className="mt-1">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="text-gray-800 font-bold">{step.label}</span>
                  {step.desc && (
                    <span className="ml-2 text-xs text-gray-400 font-medium">
                      ({step.desc})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Button */}
      <div className="px-6 pb-8">
        <button
          onClick={onBack}
          className="w-full py-4 rounded-full bg-[#004FFE] text-white text-lg font-bold shadow-lg active:scale-[0.98] transition-all"
        >
          확인했습니다
        </button>
      </div>
    </div>
  );
};

export default AccountGuide;
