"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { posts } from "@/app/_data/posts";
import { comments } from "@/app/_data/comments";

type Application = {
  role: string;
  intro: string;
  github: string;
};

type RelatedPost = {
  id: string;
  title: string;
  stack: string;
};

type CommentItem = {
  id: string;
  postId?: string;
  author: {
    name: string;
  };
  content: string;
  createdAt: string;
  likeCount: number;
  isLiked: boolean;
};

const relatedPosts: RelatedPost[] = [
  { id: "2", title: "채팅 어플리케이션", stack: "React, Socket.io" },
  { id: "3", title: "모의주식", stack: "Next.js, Python" },
  { id: "4", title: "Chatbot", stack: "TypeScript, OpenAI" },
  { id: "5", title: "여행지 추천 앱", stack: "Flutter, Firebase" },
];

export default function PostDetailPage() {
  const params = useParams();
  const post = posts.find((p) => p.id === params.id);
  const postComments = comments.filter((comment) => comment.postId === post?.id);

  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const [selectedRole, setSelectedRole] = useState("");
  const [intro, setIntro] = useState("");
  const [github, setGithub] = useState("");

  const [application, setApplication] = useState<Application | null>(null);

  if (!post) {
    return <div className="p-6">게시글 없음</div>;
  }

  const openApplicationModal = () => {
    if (application) setIsViewOpen(true);
    else setIsApplyOpen(true);
  };

  const submitApplication = () => {
    setApplication({ role: selectedRole, intro, github });
    setIsApplyOpen(false);
  };

  const openEditModal = () => {
    if (!application) return;

    setSelectedRole(application.role);
    setIntro(application.intro);
    setGithub(application.github);
    setIsViewOpen(false);
    setIsEditOpen(true);
  };

  const saveApplication = () => {
    setApplication({ role: selectedRole, intro, github });
    setIsEditOpen(false);
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-8">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1fr_280px]">
        <section>
          <div className="mb-6 aspect-video w-full rounded-2xl bg-gray-200" />

          <h1 className="mb-2 text-3xl font-bold">{post.title}</h1>

          <p className="mb-5 text-sm leading-6 text-gray-600">
            {post.description}
          </p>

          <div className="mb-5 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mb-6">
            <h2 className="mb-2 text-sm font-semibold">모집 현황</h2>

            <div className="flex flex-wrap gap-2">
              {post.recruitmentRoles.map((role) => {
                const isFull = role.current === role.total;

                return (
                  <span
                    key={role.role}
                    className={`rounded-full px-3 py-1 text-xs ${
                      isFull
                        ? "bg-gray-100 text-gray-500"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {role.role} {isFull ? "모집완료" : "모집중"} (
                    {role.current}/{role.total})
                  </span>
                );
              })}
            </div>
          </div>

          {application && (
            <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
              <p className="font-semibold">지원 완료</p>
              <p className="mt-1">
                이미 지원한 프로젝트입니다. 지원 내용을 확인하거나 수정할 수
                있어요.
              </p>
            </div>
          )}

          <div className="mb-6 flex items-center justify-between border-t border-gray-200 pt-4">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                {post.author.slice(0, 1)}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-black">
                  {post.author}
                </span>

                <button
                  type="button"
                  onClick={() => setIsFollowing((prev) => !prev)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    isFollowing
                      ? "border border-gray-200 bg-white text-black"
                      : "bg-black text-white hover:bg-gray-800"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-5 text-sm text-gray-500">
              <span>👁 {post.viewCount}</span>
              <span>♡ {post.likeCount}</span>
              <span>🔖</span>
              <span>↗</span>
            </div>
          </div>

          <button
            type="button"
            onClick={openApplicationModal}
            className="w-full rounded-xl bg-black py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            {application ? "지원서 확인" : "지원하기"}
          </button>

          <CommentSection comments={postComments} postId={post.id} />
        </section>

        <aside className="h-fit pt-1">
          <h2 className="mb-4 text-sm font-bold">관련 프로젝트</h2>

          <div className="space-y-5">
            {relatedPosts.map((item) => (
              <div
                key={item.id}
                className="cursor-pointer transition hover:opacity-80"
              >
                <div className="mb-2 aspect-video w-full rounded-xl bg-gray-200" />
                <p className="text-sm font-semibold leading-5">{item.title}</p>
                <p className="mt-1 text-xs text-gray-500">{item.stack}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {isApplyOpen && (
        <Modal title="지원하기" onClose={() => setIsApplyOpen(false)}>
          <RoleSelector
            post={post}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
          />

          <label className="mb-4 block">
            <span className="mb-2 block text-sm font-medium">자기소개</span>
            <textarea
              placeholder="간단한 자기소개를 작성해주세요."
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              className="h-28 w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-black"
            />
          </label>

          <label className="mb-5 block">
            <span className="mb-2 block text-sm font-medium">
              포트폴리오 / GitHub
            </span>
            <input
              placeholder="https://github.com/username"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-black"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsApplyOpen(false)}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm"
            >
              취소
            </button>

            <button
              type="button"
              onClick={submitApplication}
              className="flex-1 rounded-xl bg-black py-3 text-sm font-semibold text-white"
            >
              지원하기
            </button>
          </div>
        </Modal>
      )}

      {isViewOpen && application && (
        <Modal title="지원 내역" onClose={() => setIsViewOpen(false)}>
          <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
            <p className="font-semibold">지원 완료</p>
            <p className="mt-1">
              제출한 지원서입니다. 마감 전까지 수정할 수 있어요.
            </p>
          </div>

          <div className="mb-4">
            <p className="mb-2 text-sm font-medium">지원한 포지션</p>
            <span className="rounded-full border border-black px-3 py-1 text-xs">
              {application.role}
            </span>
          </div>

          <div className="mb-4">
            <p className="mb-2 text-sm font-medium">자기소개</p>
            <div className="min-h-24 rounded-xl border border-gray-200 p-3 text-sm text-gray-700">
              {application.intro || "작성된 내용이 없습니다."}
            </div>
          </div>

          <div className="mb-5">
            <p className="mb-2 text-sm font-medium">포트폴리오 / GitHub</p>
            <div className="rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-500">
              {application.github || "작성된 내용이 없습니다."}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsViewOpen(false)}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm"
            >
              닫기
            </button>

            <button
              type="button"
              onClick={openEditModal}
              className="flex-1 rounded-xl bg-black py-3 text-sm font-semibold text-white"
            >
              수정하기
            </button>
          </div>
        </Modal>
      )}

      {isEditOpen && application && (
        <Modal title="지원서 수정" onClose={() => setIsEditOpen(false)}>
          <div className="mb-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
            수정 후 다시 저장할 수 있습니다.
          </div>

          <RoleSelector
            post={post}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
          />

          <label className="mb-4 block">
            <span className="mb-2 block text-sm font-medium">자기소개</span>
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              className="h-28 w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-black"
            />
          </label>

          <label className="mb-5 block">
            <span className="mb-2 block text-sm font-medium">
              포트폴리오 / GitHub
            </span>
            <input
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-black"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm"
            >
              취소
            </button>

            <button
              type="button"
              onClick={saveApplication}
              className="flex-1 rounded-xl bg-black py-3 text-sm font-semibold text-white"
            >
              저장하기
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="text-xl text-gray-400 hover:text-black"
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function RoleSelector({
  post,
  selectedRole,
  setSelectedRole,
}: {
  post: (typeof posts)[number];
  selectedRole: string;
  setSelectedRole: (role: string) => void;
}) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-sm font-medium">지원할 포지션</p>

      <div className="flex flex-wrap gap-2">
        {post.recruitmentRoles.map((role) => {
          const isFull = role.current === role.total;
          const isSelected = selectedRole === role.role;

          return (
            <button
              key={role.role}
              type="button"
              disabled={isFull}
              onClick={() => setSelectedRole(role.role)}
              className={`rounded-full border px-3 py-1 text-xs ${
                isFull
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : isSelected
                    ? "border-black bg-black text-white"
                    : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              {role.role} ({role.current}/{role.total})
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CommentSection({
  comments,
  postId,
}: {
  comments: CommentItem[];
  postId: string;
}) {
  const [localComments, setLocalComments] =
    useState<CommentItem[]>(comments);
  const [commentInput, setCommentInput] = useState("");

  const addComment = () => {
    if (!commentInput.trim()) return;

    const newComment: CommentItem = {
      id: `temp-${Date.now()}`,
      postId,
      author: {
        name: "나",
      },
      content: commentInput,
      createdAt: "방금 전",
      likeCount: 0,
      isLiked: false,
    };

    setLocalComments((prev) => [newComment, ...prev]);
    setCommentInput("");
  };

  const toggleCommentLike = (commentId: string) => {
    setLocalComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              isLiked: !comment.isLiked,
              likeCount: comment.isLiked
                ? comment.likeCount - 1
                : comment.likeCount + 1,
            }
          : comment,
      ),
    );
  };

  return (
    <section className="mt-10 border-t border-gray-200 pt-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold">댓글 {localComments.length}개</h2>

        {/* <button type="button" className="text-sm text-gray-500 hover:text-black">
          정렬 기준
        </button> */}
      </div>

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
            className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800"
          >
            등록
          </button>
        )}
      </div>

      <div className="space-y-6">
        {localComments.map((comment) => (
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

              <p className="text-sm leading-6 text-gray-700">
                {comment.content}
              </p>

              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                <button
                  type="button"
                  onClick={() => toggleCommentLike(comment.id)}
                  className={`hover:text-black ${
                    comment.isLiked ? "text-red-500" : ""
                  }`}
                >
                  {comment.isLiked ? "♥" : "♡"} {comment.likeCount}
                </button>

                <button type="button" className="hover:text-black">
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