"use client";

import { Avatar } from "@/components/Avatar";
import FollowButton from "@/components/FollowButton";
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
  /** 서버가 계산한 "내가 작성자를 팔로우 중인지" (`post.isAuthorFollowed`) */
  initialIsAuthorFollowed: boolean;
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
  initialIsAuthorFollowed,
}: Props) {
  const t = useTranslations("board.detail");
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [copyMessage, setCopyMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 세션이 만료된 상태로 클릭하면 예전엔 unhandled rejection만 나고 아이콘이 그대로였다
  const handleLike = async () => {
    setError(null);
    try {
      const { liked } = await toggleLike(postUuid);
      setIsLiked(liked);
      setLikeCount((prev) => Math.max(0, prev + (liked ? 1 : -1)));
    } catch (err) {
      console.error("[board] 좋아요 실패:", err);
      setError(t("likeFailed"));
    }
  };

  const handleBookmark = async () => {
    setError(null);
    try {
      const { bookmarked } = await toggleBookmark(postUuid);
      setIsBookmarked(bookmarked);
    } catch (err) {
      console.error("[board] 북마크 실패:", err);
      setError(t("bookmarkFailed"));
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyMessage(t("linkCopied"));
      setTimeout(() => setCopyMessage(""), 2500);
    } catch (err) {
      // 권한 거부/비보안 컨텍스트에서 clipboard API가 실패할 수 있다
      console.error("[board] 링크 복사 실패:", err);
      setError(t("copyFailed"));
    }
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
            <FollowButton
              targetUuid={authorUuid}
              initialIsFollowing={initialIsAuthorFollowed}
              className="rounded-full px-6 py-2.5 text-sm font-semibold"
            />
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-500">
          {error}
        </p>
      )}
    </>
  );
}
