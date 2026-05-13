"use client";

import { toggleBookmark, toggleLike } from "@/lib/post";
import type { ResponsePosts } from "@/types/post";
import { LinkType, PostType } from "@/types/post";
import { Bookmark, Eye, Heart, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import ApplicationSection from "./ApplicationSection";
import CommentSection from "./CommentSection";

type Props = {
  post: ResponsePosts;
  relatedPosts: ResponsePosts[];
};

const LINK_META: Record<LinkType, { label: string; icon: string }> = {
  [LinkType.GITHUB]: { label: "GitHub", icon: "⌥" },
  [LinkType.DEPLOY]: { label: "배포 사이트", icon: "↗" },
  [LinkType.FIGMA]: { label: "Figma", icon: "▣" },
  [LinkType.ERD]: { label: "ERD", icon: "⊞" },
  [LinkType.CLASS]: { label: "클래스 다이어그램", icon: "⊟" },
  [LinkType.EXTRA]: { label: "추가 자료", icon: "+" },
};

export default function PostDetail({ post, relatedPosts }: Props) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const deployLink = post.links?.find((l) => l.type === LinkType.DEPLOY)?.url;

  const handleLike = async () => {
    await toggleLike(post.uuid);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    setIsLiked((prev) => !prev);
  };

  const handleBookmark = async () => {
    await toggleBookmark(post.uuid);
    setIsBookmarked((prev) => !prev);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-8">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1fr_280px]">
        <section>
          <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-2xl bg-gray-200">
            {post.thumbnailUrl ? (
              <>
                <Image
                  src={post.thumbnailUrl}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1280px"
                  className="object-cover"
                />
                <a
                  href={deployLink || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/70 via-black/20 to-transparent p-7 ${deployLink ? "cursor-pointer" : "cursor-default"}`}
                >
                  <p className="text-3xl font-bold leading-tight text-white drop-shadow">
                    {post.title}
                  </p>
                  {post.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.skills.slice(0, 5).map((skill) => (
                        <span
                          key={skill.id}
                          className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  )}
                </a>
              </>
            ) : null}
          </div>

          <h1 className="mb-2 text-3xl font-bold">{post.title}</h1>

          {(() => {
            const [description, features] = post.content.split("\n\n## 주요 기능\n");
            return (
              <>
                <p className="whitespace-pre-line text-sm leading-7 text-gray-600">
                  {description}
                </p>
                {features && (
                  <div className="mt-6 border-t border-gray-100 pt-6">
                    <h2 className="mb-3 text-sm font-semibold text-gray-900">주요 기능</h2>
                    <p className="whitespace-pre-line text-sm leading-7 text-gray-600">
                      {features}
                    </p>
                  </div>
                )}
              </>
            );
          })()}

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

          {post.links && post.links.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {post.links.map((link) => (
                <a
                  key={link.type}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <span>{LINK_META[link.type].icon}</span>
                  <span>{LINK_META[link.type].label}</span>
                </a>
              ))}
            </div>
          )}

          {post.postType === PostType.RECRUIT &&
            post.recruitPositionInfos.length > 0 && (
              <div className="mb-6">
                <h2 className="mb-2 text-sm font-semibold">모집 포지션</h2>
                <div className="flex flex-wrap gap-2">
                  {post.recruitPositionInfos.map((rp) => (
                    <span
                      key={rp.positionType}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700"
                    >
                      {rp.positionType} ({rp.currentCount}/{rp.maxCount})
                    </span>
                  ))}
                </div>
              </div>
            )}

          <div className="mb-6 flex items-center justify-between border-t border-gray-200 pt-4">
            <div className="flex items-center gap-4">
              <Link href={`/profile/${post.authorUuid}`}>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600 hover:opacity-80 transition">
                  {post.authorName.slice(0, 1)}
                </div>
              </Link>

              <div className="flex items-center gap-3">
                <Link
                  href={`/profile/${post.authorUuid}`}
                  className="text-sm font-medium text-black hover:underline"
                >
                  {post.authorName}
                </Link>

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
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{post.viewCount}</span>
              </div>
              <button type="button" onClick={handleLike} className="flex items-center gap-1 transition hover:text-black">
                <Heart className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
                <span>{likeCount}</span>
              </button>
              <button type="button" onClick={handleBookmark} className="transition hover:text-black" aria-label="북마크">
                <Bookmark className="h-4 w-4" fill={isBookmarked ? "currentColor" : "none"} />
              </button>
              <button type="button" onClick={handleShare} className="transition hover:text-black" aria-label="공유">
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <ApplicationSection
            postUuid={post.uuid}
            postType={post.postType}
            recruitPositions={post.recruitPositionInfos}
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
                  {item.skills.map((s) => s.name).join(", ")}
                </p>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
