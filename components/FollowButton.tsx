"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { followUser, unfollowUser } from "@/lib/user";
import { useTranslations } from "next-intl";

type Props = {
  targetUuid: string;
  /**
   * 서버가 계산한 팔로우 여부.
   * 프로필은 `profile.isFollowing`, 게시글 상세는 `post.isAuthorFollowed`를 넘긴다.
   * 예전에는 두 곳 모두 항상 false로 시작해서 이미 팔로우한 유저도 "팔로우"로 보였다.
   */
  initialIsFollowing: boolean;
  /** 호출부 레이아웃에 맞춘 버튼 클래스 (색상은 팔로우 상태에 따라 내부에서 결정) */
  className?: string;
};

/**
 * 팔로우/언팔로우 토글 버튼.
 *
 * 프로필 사이드바와 게시글 상세 AuthorBar가 각각 로컬 state만 뒤집는 no-op 버튼을
 * 따로 갖고 있어서 실제로 팔로우가 되지 않았다. 두 곳이 이 컴포넌트를 공유한다.
 */
export default function FollowButton({
  targetUuid,
  initialIsFollowing,
  className = "mt-6 w-full rounded-xl py-3 text-sm font-semibold",
}: Props) {
  const t = useTranslations("profile.follow");
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    setError(null);
    setIsPending(true);
    const next = !isFollowing;
    try {
      if (next) await followUser(targetUuid);
      else await unfollowUser(targetUuid);
      setIsFollowing(next);
      // 팔로워 수처럼 서버가 계산하는 값을 다시 가져온다
      router.refresh();
    } catch (err) {
      console.error("[follow] 팔로우 토글 실패:", err);
      setError(t("followFailed"));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        aria-pressed={isFollowing}
        className={`${className} transition disabled:opacity-50 ${
          isFollowing
            ? "border border-gray-300 bg-white text-black hover:bg-gray-50"
            : "bg-black text-white hover:bg-gray-800"
        }`}
      >
        {isFollowing ? t("following") : t("follow")}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-500">
          {error}
        </p>
      )}
    </>
  );
}
