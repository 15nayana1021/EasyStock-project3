import React, { useState } from "react";

interface LoginModalProps {
  onLogin: (nickname: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [nickname, setNickname] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim().length > 0) {
      onLogin(nickname.trim());
    } else {
      alert("닉네임을 입력해주세요!");
    }
  };

  return (
    // 배경을 어둡게 처리하여 모달에 집중하게 함
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl transform transition-all scale-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#E8F3EF] rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
            🌱
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">
            환영합니다!
          </h2>
          <p className="text-gray-400 text-sm font-bold">
            주식 게임을 시작할 닉네임을 정해주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-gray-400 ml-1">
              NICKNAME
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="예: 워렌버핏"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#2D8C69] focus:border-transparent transition-all placeholder:text-gray-300"
              maxLength={10}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={nickname.trim().length === 0}
            className="w-full bg-[#2D8C69] text-white font-black py-4 rounded-xl text-lg shadow-lg shadow-[#2D8C69]/30 hover:bg-[#247054] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            게임 시작하기
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
