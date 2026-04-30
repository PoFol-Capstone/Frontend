"use client";

import { useState } from "react";
import Link from "next/link";
import type { ResponsePosts } from "@/types/post";
import { toggleLike, toggleBookmark } from "@/lib/post";
import ApplicationSection from "./ApplicationSection";
import CommentSection from "./CommentSection";

type Props = {
  post: ResponsePosts;
  relatedPosts: ResponsePosts[];
};

export default function PostDetail({ post, relatedPosts }: Props) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = async () => {
    await toggleLike(post.uuid);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    setIsLiked((prev) => !prev);
  };

  const handleBookmark = async () => {
    await toggleBookmark(post.uuid);
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-8">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1fr_280px]">
        <section>
          <div className="mb-6 aspect-video w-full rounded-2xl bg-gray-200" />

          <h1 className="mb-2 text-3xl font-bold">{post.title}</h1>

          <p className="mb-5 text-sm leading-6 text-gray-600">{post.content}</p>

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

          {post.isRecruiting && (
            <div className="mb-6">
              <h2 className="mb-2 text-sm font-semibold">모집 포지션</h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                {post.recruitPosition} 모집중
              </span>
            </div>
          )}

          <div className="mb-6 flex items-center justify-between border-t border-gray-200 pt-4">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                {post.authorName.slice(0, 1)}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-black">
                  {post.authorName}
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
              <button type="button" onClick={handleLike}>
                {isLiked ? "♥" : "♡"} {likeCount}
              </button>
              <button type="button" onClick={handleBookmark}>
                🔖
              </button>
            </div>
          </div>

          <ApplicationSection
            postUuid={post.uuid}
            recruitPosition={post.recruitPosition}
            isRecruiting={post.isRecruiting}
          />

          <CommentSection postUuid={post.uuid} />
        </section>

        <aside className="h-fit pt-1">
          <h2 className="mb-4 text-sm font-bold">관련 프로젝트</h2>

          <div className="space-y-5">
            {relatedPosts.map((item) => (
              <Link
                key={item.uuid}
                href={`/board/${item.uuid}`}
                className="block transition hover:opacity-80"
              >
                <div className="mb-2 aspect-video w-full rounded-xl bg-gray-200" />
                <p className="text-sm font-semibold leading-5">{item.title}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {item.skills.join(", ")}
                </p>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
