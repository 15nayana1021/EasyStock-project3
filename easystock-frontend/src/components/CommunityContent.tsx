import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Heart, Send, CornerDownRight } from "lucide-react";
import {
  fetchGlobalCommunityPosts,
  postCommunityMessage,
} from "../services/api";

interface CommentItem {
  id: number;
  user: string;
  content: string;
  time: string;
}

interface PostItem {
  id: number;
  user: string;
  content: string;
  likes: number;
  isMe?: boolean;
  time?: string;
  hasLiked?: boolean;
  replyList?: CommentItem[];
  isLocalOnly?: boolean;
}

const CommunityContent: React.FC<{ userName: string }> = ({ userName }) => {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const [activeCommentPostId, setActiveCommentPostId] = useState<number | null>(
    null,
  );
  const [commentInput, setCommentInput] = useState("");

  // 🔥 [핵심 추가] 현재 시뮬레이션 가상 시간을 추적하는 상태
  const [simTime, setSimTime] = useState<string>("09:00");

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const serverData = await fetchGlobalCommunityPosts();

        if (serverData && serverData.length > 0) {
          // 서버에서 온 가장 최신 글의 시간을 현재 시뮬레이션 시간으로 동기화
          const latestTime = serverData[0].time; // ex: "09:05:00"
          setSimTime(latestTime.substring(0, 5)); // "09:05" 형식으로 자름
        }

        setPosts((currentPosts) => {
          const localPosts = currentPosts.filter((p) => p.isLocalOnly);

          const mergedServerPosts = serverData.map((serverPost: any) => {
            const existingPost = currentPosts.find(
              (p) => p.id === serverPost.id,
            );
            // 백엔드 시간 형식(HH:MM:SS)을 프론트엔드 형식(HH:MM)으로 맞춤
            const displayTime =
              serverPost.time.length >= 5
                ? serverPost.time.substring(0, 5)
                : serverPost.time;

            return {
              id: serverPost.id,
              user: serverPost.author,
              content: serverPost.content,
              time: displayTime,
              isMe:
                serverPost.author === "나 (User)" ||
                serverPost.author === userName,
              likes: existingPost
                ? existingPost.likes
                : Math.floor(Math.random() * 15) + 1,
              hasLiked: existingPost ? existingPost.hasLiked : false,
              replyList: existingPost ? existingPost.replyList : [],
              isLocalOnly: false,
            };
          });

          const finalPosts = [...localPosts, ...mergedServerPosts];
          const uniquePosts = finalPosts.filter(
            (post, index, self) =>
              index === self.findIndex((p) => p.id === post.id),
          );

          return uniquePosts;
        });
      } catch (error) {
        console.error("커뮤니티 데이터를 불러오지 못했습니다.", error);
      }
    };

    loadPosts();
    const interval = setInterval(loadPosts, 2000);
    return () => clearInterval(interval);
  }, [userName]);

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const newPost: PostItem = {
      id: Date.now(),
      user: userName || "나 (User)",
      content: trimmed,
      likes: 0,
      isMe: true,
      // 🔥 현실 시간(new Date) 삭제 -> 가상 시간(simTime) 적용!
      time: simTime,
      hasLiked: false,
      replyList: [],
      isLocalOnly: true,
    };

    setPosts((prev) => [newPost, ...prev]);
    setInputValue("");

    try {
      await postCommunityMessage(userName || "나 (User)", trimmed, "GLOBAL");
    } catch (error) {
      console.error("메시지 전송 실패", error);
    }

    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleLike = (postId: number) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            likes: p.hasLiked ? p.likes - 1 : p.likes + 1,
            hasLiked: !p.hasLiked,
          };
        }
        return p;
      }),
    );
  };

  const toggleCommentBox = (postId: number) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
    } else {
      setActiveCommentPostId(postId);
    }
    setCommentInput("");
  };

  const submitComment = (postId: number) => {
    if (!commentInput.trim()) return;

    const newComment: CommentItem = {
      id: Date.now(),
      user: userName || "나 (User)",
      content: commentInput.trim(),
      // 🔥 대댓글에도 가상 시간 적용!
      time: simTime,
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return { ...p, replyList: [...(p.replyList || []), newComment] };
        }
        return p;
      }),
    );

    setCommentInput("");
  };

  return (
    <div className="flex flex-col h-full bg-[#CFE3FA] rounded-t-[2.5rem] border border-white/50 shadow-inner overflow-hidden relative">
      {/* 헤더 영역 */}
      <div className="p-5 pb-3 shrink-0">
        <div className="flex items-center justify-center">
          <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">
            커뮤니티
          </h2>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 hide-scrollbar space-y-3 pb-4"
      >
        {posts.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500 font-bold">
            에이전트들이 활동을 시작하기를 기다리는 중...
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-blue-50/50 animate-in fade-in slide-in-from-bottom-2 duration-300 transition-all"
            >
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <h3
                    className={`text-sm font-bold ${post.isMe ? "text-[#1E88E5]" : "text-gray-800"}`}
                  >
                    {post.isMe ? `${post.user} • 나` : post.user}
                  </h3>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {post.time}
                  </span>
                </div>
                <p className="text-sm text-gray-700 font-medium whitespace-pre-line leading-relaxed">
                  {post.content}
                </p>

                <div className="h-[1px] w-full bg-gray-50 my-2"></div>

                <div className="flex items-center space-x-5 pt-1">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className="flex items-center space-x-1.5 group outline-none active:scale-90 transition-transform"
                  >
                    <Heart
                      size={16}
                      className={`transition-colors ${post.hasLiked ? "text-[#E53935] fill-[#E53935]" : "text-gray-300 group-hover:text-[#E53935]"}`}
                    />
                    <span
                      className={`text-xs font-bold ${post.hasLiked ? "text-[#E53935]" : "text-gray-400"}`}
                    >
                      {post.likes}
                    </span>
                  </button>
                  <button
                    onClick={() => toggleCommentBox(post.id)}
                    className="flex items-center space-x-1.5 group outline-none active:scale-90 transition-transform"
                  >
                    <MessageSquare
                      size={16}
                      className={`transition-colors ${activeCommentPostId === post.id ? "text-[#1E88E5] fill-blue-50" : "text-gray-300 group-hover:text-[#1E88E5]"}`}
                    />
                    <span
                      className={`text-xs font-bold ${activeCommentPostId === post.id ? "text-[#1E88E5]" : "text-gray-400"}`}
                    >
                      {post.replyList ? post.replyList.length : 0}
                    </span>
                  </button>
                </div>

                {post.replyList && post.replyList.length > 0 && (
                  <div className="mt-3 space-y-2 pl-2">
                    {post.replyList.map((reply, idx) => (
                      <div
                        key={idx}
                        className="flex space-x-2 items-start bg-gray-50 p-2.5 rounded-xl border border-gray-100"
                      >
                        <CornerDownRight
                          size={12}
                          className="text-gray-400 mt-0.5 shrink-0"
                        />
                        <div className="flex-1 flex flex-col">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <span className="text-[11px] font-bold text-[#1E88E5]">
                              {reply.user}
                            </span>
                            <span className="text-[9px] text-gray-400">
                              {reply.time}
                            </span>
                          </div>
                          <span className="text-[12px] text-gray-700 font-medium leading-snug">
                            {reply.content}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeCommentPostId === post.id && (
                  <div className="mt-3 flex items-center bg-[#F4F8F6] p-1.5 pl-3 rounded-full border border-gray-200 animate-in fade-in duration-200">
                    <input
                      type="text"
                      autoFocus
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                          e.preventDefault();
                          submitComment(post.id);
                        }
                      }}
                      placeholder="답글 달기..."
                      className="flex-1 bg-transparent border-none outline-none text-xs font-medium text-gray-700 placeholder-gray-400"
                    />
                    <button
                      onClick={() => submitComment(post.id)}
                      disabled={!commentInput.trim()}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        commentInput.trim()
                          ? "bg-[#004FFE] text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      <Send
                        size={12}
                        className={
                          commentInput.trim() ? "translate-x-[-1px]" : ""
                        }
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div className="h-4"></div>
      </div>

      <div className="px-4 pt-4 pb-28 bg-gradient-to-t from-[#e1eaf5] via-[#e1eaf5] to-transparent shrink-0">
        <div className="bg-white rounded-full p-1.5 pl-5 shadow-inner border border-white/50 flex items-center justify-between">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="자유롭게 의견을 남겨보세요..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-600 placeholder-gray-300 font-medium"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={`w-9 h-9 text-white rounded-full flex items-center justify-center transition-all shadow-md ml-2 ${
              inputValue.trim()
                ? "bg-[#004FFE] hover:bg-[#051960] active:scale-95"
                : "bg-gray-300"
            }`}
          >
            <Send
              size={16}
              className={inputValue.trim() ? "translate-x-[-1px]" : ""}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunityContent;
