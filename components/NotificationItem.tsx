"use client";

import { useRouter } from "next/navigation";
import type { Notification } from "@/types/notification";

type NotificationItemProps = {
  notification: Notification;
  onRead: (uuid: string) => void;
};

function getNotificationMessage(notification: Notification) {
  const { type, actor, post, count } = notification;
  const actorLabel =
    count > 1 ? `${actor.name}님 외 ${count - 1}명` : `${actor.name}님`;

  switch (type) {
    case "LIKE_POST":
      return `${actorLabel}이 게시글을 좋아합니다.`;

    case "COMMENT_POST":
      return `${actorLabel}이 게시글에 댓글을 남겼습니다.`;

    case "FOLLOW":
      return `${actorLabel}이 팔로우했습니다.`;

    case "APPLICATION_SUBMITTED":
      return `${actorLabel}이 프로젝트에 지원했습니다.`;

    case "APPLICATION_ACCEPTED":
      return post
        ? `"${post.title}" 프로젝트 합류가 승인되었습니다.`
        : "프로젝트 합류가 승인되었습니다.";

    case "APPLICATION_REJECTED":
      return post
        ? `"${post.title}" 프로젝트 합류가 거절되었습니다.`
        : "프로젝트 합류가 거절되었습니다.";
  }
}

function getNotificationHref(notification: Notification) {
  if (notification.type === "FOLLOW") {
    return `/profile/${notification.actor.uuid}`;
  }

  if (notification.post) {
    return `/board/${notification.post.uuid}`;
  }

  return null;
}

function getRelativeTime(createdAt: string) {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;

  return new Date(createdAt).toLocaleDateString("ko-KR");
}

export default function NotificationItem({
  notification,
  onRead,
}: NotificationItemProps) {
  const router = useRouter();

  const handleClick = () => {
    if (!notification.isRead) {
      onRead(notification.uuid);
    }

    const href = getNotificationHref(notification);
    if (href) router.push(href);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex w-full items-start gap-1.5 border-b border-gray-100 px-5 py-4 text-left transition hover:bg-gray-50 ${
        notification.isRead ? "bg-white" : "bg-gray-50"
      }`}
    >
      <div className="mt-1.75 flex w-3 shrink-0 justify-center">
        {!notification.isRead && (
          <span className="h-1.5 w-1.5 rounded-full bg-gray-500" />
        )}
      </div>

      <div className="flex-1">
        <p className="text-sm text-gray-800">
          {getNotificationMessage(notification)}
        </p>

        <p className="mt-1 text-xs text-gray-400">
          {getRelativeTime(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}
