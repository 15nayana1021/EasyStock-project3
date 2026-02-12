import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, Plus, Send, List, Check } from "lucide-react";

interface Message {
  id: number;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
  agentId?: number; // 어떤 에이전트가 보냈는지 식별
}

interface Agent {
  id: number;
  name: string;
  desc: string;
  avatarSeed: string;
  bgColor: string;
  type: "fox" | "wolf" | "dog" | "owl";
}

interface ChatbotContentProps {
  onBack: () => void;
}

const agents: Agent[] = [
  {
    id: 1,
    name: "전략형 여우",
    desc: "시장 흐름 중심 분석",
    avatarSeed: "Garrett",
    bgColor: "bg-[#FFEDD5]",
    type: "fox",
  },
  {
    id: 2,
    name: "안정형 여우",
    desc: "리스크 최소화 투자 스타일",
    avatarSeed: "Felix",
    bgColor: "bg-[#E0F2FE]",
    type: "wolf",
  },
  {
    id: 3,
    name: "신중형 여우",
    desc: "보수적 시나리오 점검",
    avatarSeed: "Buster",
    bgColor: "bg-[#F3F4F6]",
    type: "dog",
  },
  {
    id: 4,
    name: "멘토 부엉이",
    desc: "투자 개념 학습 도우미",
    avatarSeed: "Bandit",
    bgColor: "bg-[#FEF3C7]",
    type: "owl",
  },
];

const ChatbotContent: React.FC<ChatbotContentProps> = ({ onBack }) => {
  const [step, setStep] = useState<"select" | "chat">("select");
  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "chat" && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, step]);

  const toggleAgent = (id: number) => {
    setSelectedAgentIds((prev) =>
      prev.includes(id) ? prev.filter((aid) => aid !== id) : [...prev, id],
    );
  };

  const handleStartChat = () => {
    if (selectedAgentIds.length === 0) return;

    // 초기 환영 메시지 생성
    const welcomeMessages: Message[] = selectedAgentIds.map((id, index) => {
      const agent = agents.find((a) => a.id === id);
      return {
        id: Date.now() + index,
        sender: "ai",
        text: `안녕하세요! ${agent?.name}입니다. 무엇을 도와드릴까요?`,
        timestamp: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        agentId: id,
      };
    });

    setMessages(welcomeMessages);
    setStep("chat");
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now(),
      sender: "user",
      text: inputValue,
      timestamp: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = inputValue;
    setInputValue("");

    // 선택된 모든 에이전트가 순차적으로 응답
    selectedAgentIds.forEach((agentId, index) => {
      setTimeout(
        () => {
          const agent = agents.find((a) => a.id === agentId);
          const aiMsg: Message = {
            id: Date.now() + 1 + index,
            sender: "ai",
            text: `[${agent?.name}] '${currentInput}'에 대한 분석 의견을 드립니다.`,
            timestamp: new Date().toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            agentId: agentId,
          };
          setMessages((prev) => [...prev, aiMsg]);
        },
        1000 + index * 800,
      ); // 약간의 시차를 두고 응답
    });
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  // 에이전트 선택 화면 렌더링
  if (step === "select") {
    return (
      <div className="flex flex-col h-full bg-[#F4F8F6] relative animate-in fade-in duration-300">
        {/* Header */}
        <div className="px-5 pt-8 pb-4 flex items-center justify-between shrink-0">
          <button
            onClick={onBack}
            className="text-[#1A334E] hover:opacity-70 transition-opacity"
          >
            <ChevronLeft size={32} strokeWidth={2.5} />
          </button>
          <button
            onClick={handleStartChat}
            disabled={selectedAgentIds.length === 0}
            className={`px-5 py-2.5 rounded-2xl font-black text-[13px] tracking-tight transition-all ${
              selectedAgentIds.length > 0
                ? "bg-[#E9EEF3] text-[#7A9BB5] shadow-sm"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
          >
            선택완료 &gt;
          </button>
        </div>

        <div className="px-6 pb-6 shrink-0">
          <h1 className="text-[26px] font-black text-[#1A334E] leading-tight tracking-tight">
            함께할 AI 파트너를
            <br />
            선택해주세요
          </h1>
          <p className="text-[14px] text-gray-400 font-bold mt-2">
            중복 선택이 가능합니다.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-10 hide-scrollbar content-start">
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            {agents.map((agent) => {
              const isSelected = selectedAgentIds.includes(agent.id);
              return (
                <div
                  key={agent.id}
                  onClick={() => toggleAgent(agent.id)}
                  className={`relative rounded-[2rem] p-6 pb-8 flex flex-col items-center text-center transition-all cursor-pointer border-2 shadow-sm ${
                    isSelected
                      ? "bg-white border-transparent ring-2 ring-[#2D8C69]/30"
                      : "bg-white border-transparent hover:border-gray-100"
                  }`}
                >
                  {/* Radio-style check circle */}
                  <div
                    className={`absolute top-4 left-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-[#2D8C69] border-[#2D8C69] scale-110 shadow-sm"
                        : "bg-[#F4F8F6] border-[#D1DFD9]"
                    }`}
                  >
                    {isSelected && (
                      <Check size={14} className="text-white" strokeWidth={3} />
                    )}
                  </div>

                  {/* Avatar Container */}
                  <div
                    className={`w-24 h-24 rounded-full ${agent.bgColor} mb-4 overflow-hidden flex items-center justify-center border-4 border-white shadow-inner`}
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/big-ears-neutral/svg?seed=${agent.avatarSeed}`}
                      alt={agent.name}
                      className="w-[85%] h-[85%] object-contain mt-1"
                    />
                  </div>

                  <h3 className="font-black text-[#1A334E] text-base mb-1 tracking-tight">
                    {agent.name}
                  </h3>
                  <p className="text-[11px] text-gray-400 font-bold break-keep leading-tight">
                    {agent.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 채팅 화면 렌더링
  return (
    <div className="flex flex-col h-full bg-[#E9EEF3] overflow-hidden font-['Pretendard'] animate-in slide-in-from-right duration-300">
      {/* Chat Header */}
      <div className="bg-[#2D8C69] px-4 py-3 flex items-center justify-between shadow-md shrink-0 z-20">
        <div className="flex items-center">
          <button
            onClick={() => setStep("select")}
            className="w-8 h-8 flex items-center justify-center text-white mr-2"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col">
            <h2 className="text-white font-bold text-lg leading-none">
              AI 투자 조언
            </h2>
            <span className="text-[10px] text-white/80 font-medium">
              {selectedAgentIds.length}명의 에이전트와 대화 중
            </span>
          </div>
        </div>
        <button className="text-white p-2">
          <List size={22} />
        </button>
      </div>

      {/* Chat Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pt-6 pb-6 hide-scrollbar space-y-6"
      >
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          const agent = isUser
            ? null
            : agents.find((a) => a.id === msg.agentId);

          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"} items-end space-x-2`}
            >
              {!isUser && (
                <div className="flex flex-col items-center space-y-1 self-start">
                  <div
                    className={`w-10 h-10 rounded-full ${agent?.bgColor || "bg-white"} border border-gray-100 shadow-sm overflow-hidden flex items-center justify-center p-1`}
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/big-ears-neutral/svg?seed=${agent?.avatarSeed || "Felix"}`}
                      alt="AI"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[9px] font-bold text-gray-500">
                    {agent?.name}
                  </span>
                </div>
              )}

              <div
                className={`max-w-[70%] px-4 py-3 rounded-[1.5rem] shadow-sm text-sm font-bold leading-relaxed ${
                  isUser
                    ? "bg-[#2D8C69] text-white rounded-tr-none"
                    : "bg-white text-gray-800 rounded-tl-none border border-white"
                }`}
              >
                {msg.text}
              </div>

              <span className="text-[9px] text-gray-400 font-medium mb-1 whitespace-nowrap self-end">
                {msg.timestamp}
              </span>
            </div>
          );
        })}
      </div>

      {/* Chat Input Bar - Adjusted with margin to avoid overlap with BottomNav */}
      <div className="px-4 pt-2 pb-28 bg-gradient-to-t from-[#E9EEF3] via-[#E9EEF3] to-transparent shrink-0">
        <div className="bg-white rounded-full p-2 flex items-center shadow-lg border border-white">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => console.log(e.target.files)}
          />
          <button
            onClick={handleFileClick}
            className="p-2 text-[#2D8C69] hover:bg-green-50 rounded-full transition-colors"
          >
            <Plus size={24} />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="메시지를 입력하세요..."
            className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-gray-700 placeholder-gray-300 px-2"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all ${
              inputValue.trim()
                ? "bg-[#2D8C69] text-white"
                : "bg-gray-100 text-gray-300"
            }`}
          >
            <Send size={18} fill={inputValue.trim() ? "white" : "none"} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotContent;
