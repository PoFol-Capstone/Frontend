"use client";

import { Avatar } from "@/components/Avatar";
import { toggleBookmark, toggleLike } from "@/lib/post";
import { Bookmark, Eye, Heart, Share2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  postUuid: string;
  authorUuid: string;
  authorName: string;
  isAuthor: boolean;
  viewCount: number;
  initialLikeCount: number;
  initialIsLiked: boolean;
  initialIsBookmarked: boolean;
};

export default function AuthorBar({
  postUuid,
  authorUuid,
  authorName,
  isAuthor,
  viewCount,
  initialLikeCount,
  initialIsLiked,
  initialIsBookmarked,
}: Props) {
  const t = useTranslations("board.detail");
  const [isFollowing, setIsFollowing] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [copyMessage, setCopyMessage] = useState("");

  const handleLike = async () => {
    const { liked } = await toggleLike(postUuid);
    setIsLiked(liked);
    setLikeCount((prev) => Math.max(0, prev + (liked ? 1 : -1)));
  };

  const handleBookmark = async () => {
    const { bookmarked } = await toggleBookmark(postUuid);
    setIsBookmarked(bookmarked);
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopyMessage(t("linkCopied"));
    setTimeout(() => setCopyMessage(""), 2500);
  };

  return (
    <>
      {copyMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gray-800 px-5 py-2.5 text-sm text-white shadow-lg">
          {copyMessage}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-6">
        <Link href={`/profile/${authorUuid}`} className="group flex items-center gap-3">
          <Avatar
            src={null}
            name={authorName}
            size="md"
            className="transition group-hover:opacity-80"
          />
          <span className="text-sm font-semibold text-black group-hover:underline">
            {authorName}
          </span>
        </Link>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {viewCount}
            </span>
            <button
              type="button"
              onClick={handleLike}
              className="flex items-center gap-1 transition hover:text-black"
            >
              <Heart
                className="h-4 w-4"
                fill={isLiked ? "currentColor" : "none"}
              />
              {likeCount}
            </button>
            <button
              type="button"
              onClick={handleBookmark}
              className="transition hover:text-black"
              aria-label={t("bookmark")}
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
              aria-label={t("share")}
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          {!isAuthor && (
            <button
              type="button"
              onClick={() => setIsFollowing((prev) => !prev)}
              className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
                isFollowing
                  ? "border border-gray-300 bg-white text-black hover:bg-gray-50"
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              {isFollowing ? t("following") : t("follow")}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
