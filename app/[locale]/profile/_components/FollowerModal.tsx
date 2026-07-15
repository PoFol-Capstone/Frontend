"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { FollowerUser } from "@/types/user";
import { useTranslations } from "next-intl";

type Props = {
  onClose: () => void;
  followers: FollowerUser[];
  onToggleFollow: (userId: number) => void;
};

export default function FollowerModal({
  onClose,
  followers,
  onToggleFollow,
}: Props) {
  const t = useTranslations("profile.followerModal");
  const tFollow = useTranslations("profile.follow");
  const [search, setSearch] = useState("");

  const filteredUsers = followers.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex h-[430px] max-h-[80dvh] w-full max-w-sm flex-col rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{t("title")}</h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 transition hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-black"
        />

        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-lg p-3 transition hover:bg-gray-100"
            >
              <span>{user.name}</span>

              <button
                type="button"
                onClick={() => onToggleFollow(user.id)}
                className={`rounded-lg px-3 py-1 text-sm transition ${
                  user.isFollowing
                    ? "border border-black bg-white text-black hover:bg-gray-100"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                {user.isFollowing ? tFollow("following") : tFollow("follow")}
              </button>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-500">
              {search
                ? t("noResults")
                : t("empty")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}