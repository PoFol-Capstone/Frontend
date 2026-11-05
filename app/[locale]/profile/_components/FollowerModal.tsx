"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import Modal from "@/components/Modal";
import { Link, useRouter } from "@/i18n/navigation";
import { followUser, unfollowUser } from "@/lib/user";
import type { FollowerUser } from "@/types/user";
import { useTranslations } from "next-intl";

type Props = {
  onClose: () => void;
  /** 조회 실패면 null — "팔로워가 없습니다"가 아니라 실패로 보여준다 */
  followers: FollowerUser[] | null;
  /** 로그인한 조회자 uuid — 목록에 본인이 있을 때 팔로우 버튼을 숨기기 위함 */
  viewerUuid?: string | null;
};

export default function FollowerModal({ onClose, followers, viewerUuid }: Props) {
  const t = useTranslations("profile.followerModal");
  const tFollow = useTranslations("profile.follow");

  const [search, setSearch] = useState("");
  // 서버가 준 초기 상태를 로컬에서 낙관적으로 갱신 (모달을 닫아도 페이지 데이터는 다음 조회 때 정확)
  const [users, setUsers] = useState(followers ?? []);
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
    <Modal
      title={t("title")}
      onClose={onClose}
      className="flex h-[480px] max-w-sm flex-col"
    >
      <input
        type="text"
        placeholder={t("searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label={t("searchPlaceholder")}
        className="input mb-3"
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
            <Link
              href={`/profile/${user.uuid}`}
              onClick={onClose}
              className="group flex items-center gap-2"
            >
              <Avatar src={user.avatarUrl} name={user.name} size="sm" />
              <span className="group-hover:underline">{user.name}</span>
            </Link>

            {user.uuid !== viewerUuid && (
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
            )}
          </div>
        ))}

        {followers === null && (
          <p role="alert" className="py-10 text-center text-sm text-red-500">
            {t("loadFailed")}
          </p>
        )}

        {followers !== null && filteredUsers.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-500">
            {search ? t("noResults") : t("empty")}
          </p>
        )}
      </div>
    </Modal>
  );
}
