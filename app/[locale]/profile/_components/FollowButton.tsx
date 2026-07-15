"use client";

import { useState } from "react";
import { followUser, unfollowUser } from "@/lib/user";
import { useTranslations } from "next-intl";

interface Props {
  targetUuid: string;
}

export default function FollowButton({ targetUuid }: Props) {
  const t = useTranslations("profile.follow");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async () => {
    setIsPending(true);
    try {
      if (isFollowing) {
        await unfollowUser(targetUuid);
      } else {
        await followUser(targetUuid);
      }
      setIsFollowing((prev) => !prev);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`mt-6 w-full rounded-xl py-3 text-sm font-semibold transition disabled:opacity-50 ${
        isFollowing
          ? "border border-gray-300 bg-white text-black hover:bg-gray-50"
          : "bg-black text-white hover:bg-gray-800"
      }`}
    >
      {isFollowing ? t("following") : t("follow")}
    </button>
  );
}
