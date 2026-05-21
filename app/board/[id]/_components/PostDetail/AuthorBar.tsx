"use client";

import { toggleBookmark, toggleLike } from "@/lib/post";
import { Bookmark, Eye, Heart, Share2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  postUuid: string;
  authorUuid: string;
  authorName: string;
  viewCount: number;
  initialLikeCount: number;
};

export default function AuthorBar({
  postUuid,
  authorUuid,
  authorName,
  viewCount,
  initialLikeCount,
}: Props) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    setIsBookmarked(saved.includes(postUuid));
  }, [postUuid]);

  useEffect(() => {
    const savedLikes: string[] = JSON.parse(
      localStorage.getItem("likes") || "[]"
    );
    setIsLiked(savedLikes.includes(postUuid));
  }, [postUuid]);

  const handleLike = async () => {
    await toggleLike(postUuid);
    
    const savedLikes: string[] = JSON.parse(
      localStorage.getItem("likes") || "[]"
    );

    let nextLikes: string[];

    if (savedLikes.includes(postUuid)){
      nextLikes = savedLikes.filter((id) => id !== postUuid);
      setIsLiked(false);
      setLikeCount((prev) => Math.max(0, prev - 1));
    } else {
      nextLikes = [...savedLikes, postUuid];
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
    }

    localStorage.setItem("likes", JSON.stringify(nextLikes));
  };

  const handleBookmark = async () => {
    await toggleBookmark(postUuid);

    const saved = JSON.parse(localStorage.getItem("bookmarks") || "[]");

    let nextBookmarks: string[];

    if (saved.includes(postUuid)) {
      nextBookmarks = saved.filter((id: string) => id !== postUuid);
      setIsBookmarked(false);
    } else {
      nextBookmarks = [...saved, postUuid];
      setIsBookmarked(true);
    }

    localStorage.setItem("bookmarks", JSON.stringify(nextBookmarks));
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopyMessage("URL이 복사되었습니다.");
    setTimeout(() => setCopyMessage(""), 2500);
  };

  return (
    <>
      {copyMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gray-800 px-5 py-2.5 text-sm text-white shadow-lg">
          {copyMessage}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between border-t border-gray-200 pt-4">
        <div className="flex items-center gap-4">
          <Link href={`/profile/${authorUuid}`}>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600 hover:opacity-80 transition">
              {authorName.slice(0, 1)}
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${authorUuid}`}
              className="text-sm font-medium text-black hover:underline"
            >
              {authorName}
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
            <span>{viewCount}</span>
          </div>
          <button
            type="button"
            onClick={handleLike}
            className="flex items-center gap-1 transition hover:text-black"
          >
            <Heart
              className="h-4 w-4"
              fill={isLiked ? "currentColor" : "none"}
            />
            <span>{likeCount}</span>
          </button>
          <button
            type="button"
            onClick={handleBookmark}
            className="transition hover:text-black"
            aria-label="북마크"
          >
            <Bookmark
              className="h-4 w-4"
              fill={isBookmarked ? "currentColor" : "none"}
            />
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="transition hover:text-black"
            aria-label="공유"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
