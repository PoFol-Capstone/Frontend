"use client";

import { useId, useState } from "react";
import { X } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { useModalA11y } from "@/hooks/useModalA11y";
import { useRouter } from "@/i18n/navigation";
import { followUser, unfollowUser } from "@/lib/user";
import type { FollowerUser } from "@/types/user";
import { useTranslations } from "next-intl";

type Props = {
  onClose: () => void;
  followers: FollowerUser[];
};

export default function FollowerModal({ onClose, followers }: Props) {
  const t = useTranslations("profile.followerModal");
  const tFollow = useTranslations("profile.follow");
  const tCommon = useTranslations("common");
  const panelRef = useModalA11y(onClose);
  const titleId = useId();

  const [search, setSearch] = useState("");
  // 서버가 준 초기 상태를 로컬에서 낙관적으로 갱신 (모달을 닫아도 페이지 데이터는 다음 조회 때 정확)
  const [users, setUsers] = useState(followers);
  const [pendingUuid, setPendingUuid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleToggleFollow = async (target: FollowerUser) => {
    setError(null);
    setPendingUuid(target.uuid);

    const next = !target.isFollowing;
    // 낙관적 갱신 후 실패하면 되돌린다
    setUsers((prev) =>
      prev.map((u) =>
        u.uuid === target.uuid ? { ...u, isFollowing: next } : u,
      ),
    );

    try {
      if (next) await followUser(target.uuid);
      else await unfollowUser(target.uuid);
      // 팔로워 수 등 서버가 계산하는 값을 다시 가져온다
      router.refresh();
    } catch (err) {
      console.error("[profile] 팔로우 토글 실패:", err);
      setUsers((prev) =>
        prev.map((u) =>
          u.uuid === target.uuid ? { ...u, isFollowing: target.isFollowing } : u,
        ),
      );
      setError(tFollow("followFailed"));
    } finally {
      setPendingUuid(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex h-[430px] max-h-[80dvh] w-full max-w-sm flex-col rounded-2xl bg-white p-4 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id={titleId} className="text-lg font-bold">
            {t("title")}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label={tCommon("close")}
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
          className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-black"
        />

        {error && (
          <p role="alert" className="mb-2 text-sm text-red-500">
            {error}
          </p>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {filteredUsers.map((user) => (
            <div
              key={user.uuid}
              className="flex items-center justify-between rounded-lg p-3 transition hover:bg-gray-100"
            >
              <div className="flex items-center gap-2">
                <Avatar src={user.avatarUrl} name={user.name} size="sm" />
                <span>{user.name}</span>
              </div>

              <button
                type="button"
                onClick={() => handleToggleFollow(user)}
                disabled={pendingUuid === user.uuid}
                aria-pressed={user.isFollowing}
                className={`rounded-lg px-3 py-1 text-sm transition disabled:opacity-50 ${
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
              {search ? t("noResults") : t("empty")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
