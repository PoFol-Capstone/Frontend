"use client";

import { CornerDownRight, Heart, Send } from "lucide-react";
import { useState } from "react";
import type { Comment } from "@/types/comment";

const MOCK_COMMENTS: Comment[] = [
  {
    id: "mock-1",
    postId: "mock-post",
    author: { id: "user-1", name: "김민준" },
    content: "프로젝트 구성이 정말 깔끔하네요! 특히 기술 스택 선택이 인상적입니다.",
    createdAt: "2025-05-10T09:23:00Z",
    likeCount: 5,
    isLiked: false,
  },
  {
    id: "mock-2",
    postId: "mock-post",
    author: { id: "user-2", name: "이서연" },
    content: "UI 디자인이 세련됐어요. 혹시 Figma 디자인 파일도 공유 가능한가요?",
    createdAt: "2025-05-11T14:05:00Z",
    likeCount: 3,
    isLiked: true,
  },
  {
    id: "mock-3",
    postId: "mock-post",
    author: { id: "user-3", name: "박지훈" },
    content: "백엔드 아키텍처가 궁금한데 ERD 링크가 있으면 좋겠습니다!",
    createdAt: "2025-05-12T18:47:00Z",
    likeCount: 1,
    isLiked: false,
  },
];

type Props = {
  postUuid: string;
  initialComments?: Comment[];
};

export default function CommentSection({
  postUuid,
  initialComments = MOCK_COMMENTS,
}: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentInput, setCommentInput] = useState("");

  const addComment = () => {
    if (!commentInput.trim()) return;

    const newComment: Comment = {
      id: `temp-${Date.now()}`,
      postId: postUuid,
      author: { id: "me", name: "나" },
      content: commentInput,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      isLiked: false,
    };

    setComments((prev) => [newComment, ...prev]);
    setCommentInput("");
  };

  const toggleCommentLike = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              isLiked: !c.isLiked,
              likeCount: c.isLiked ? c.likeCount - 1 : c.likeCount + 1,
            }
          : c,
      ),
    );
  };

  return (
    <section className="mt-10 border-t border-gray-200 pt-8">
      <h2 className="mb-5 text-lg font-bold">댓글 {comments.length}개</h2>

      <div className="mb-6 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-cyan-300" />
        <input
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addComment();
          }}
          placeholder="댓글 추가..."
          className="flex-1 border-b border-gray-200 py-2 text-sm outline-none focus:border-black"
        />
        {commentInput.trim() && (
          <button
            type="button"
            onClick={addComment}
            className="flex items-center gap-1 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800"
          >
            <Send className="h-3 w-3" />
            등록
          </button>
        )}
      </div>

      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
              {comment.author.name.slice(0, 1)}
            </div>
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <p className="text-sm font-semibold">{comment.author.name}</p>
                <span className="text-xs text-gray-400">
                  {comment.createdAt}
                </span>
              </div>
              <p className="text-sm leading-6 text-gray-700">{comment.content}</p>
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                <button
                  type="button"
                  onClick={() => toggleCommentLike(comment.id)}
                  className={`flex items-center gap-1 transition hover:text-black ${comment.isLiked ? "text-red-500" : ""}`}
                >
                  <Heart className="h-4 w-4" fill={comment.isLiked ? "currentColor" : "none"} />
                  <span>{comment.likeCount}</span>
                </button>
                <button type="button" className="flex items-center gap-1 transition hover:text-black">
                  <CornerDownRight className="h-4 w-4" />
                  답글
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
