"use client";

import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { Notification } from "@/types/notification";

type NotificationItemProps = {
  notification: Notification;
  onRead: (uuid: string) => void;
};

function getNotificationMessage(
  notification: Notification,
  t: ReturnType<typeof useTranslations<"notification">>,
) {
  const { type, actor, post, count } = notification;
  const actorLabel =
    count > 1
      ? t("actorWithOthers", { name: actor.name, count: count - 1 })
      : t("actorOnly", { name: actor.name });

  switch (type) {
    case "LIKE_POST":
      return t("likePost", { actor: actorLabel });

    case "COMMENT_POST":
      return t("commentPost", { actor: actorLabel });

    case "FOLLOW":
      return t("follow", { actor: actorLabel });

    case "APPLICATION_SUBMITTED":
      return t("applicationSubmitted", { actor: actorLabel });

    case "APPLICATION_ACCEPTED":
      return post
        ? t("applicationAcceptedWithTitle", { title: post.title })
        : t("applicationAccepted");

    case "APPLICATION_REJECTED":
      return post
        ? t("applicationRejectedWithTitle", { title: post.title })
        : t("applicationRejected");
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

function getRelativeTime(
  createdAt: string,
  t: ReturnType<typeof useTranslations<"notification">>,
  locale: string,
) {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return t("justNow");
  if (diffMin < 60) return t("minutesAgo", { minutes: diffMin });

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return t("hoursAgo", { hours: diffHour });

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return t("daysAgo", { days: diffDay });

  return new Date(createdAt).toLocaleDateString(locale);
}

export default function NotificationItem({
  notification,
  onRead,
}: NotificationItemProps) {
  const router = useRouter();
  const t = useTranslations("notification");
  const locale = useLocale();

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
          {getNotificationMessage(notification, t)}
        </p>

        <p className="mt-1 text-xs text-gray-400">
          {getRelativeTime(notification.createdAt, t, locale)}
        </p>
      </div>
    </button>
  );
}
