export type Notification = {
  id: number;
  type: "follow" | "bookmark" | "apply" | "like";
  username: string;
  read: boolean;
};

type NotificationItemProps = {
  notification: Notification;
};

function getNotificationMessage(notification: Notification) {
  switch (notification.type) {
    case "follow":
      return `${notification.username}님이 팔로우했습니다.`;

    case "bookmark":
      return `${notification.username}님이 게시글을 저장했습니다.`;

    case "apply":
      return `${notification.username}님이 프로젝트에 지원했습니다.`;

    case "like":
      return `${notification.username}님이 좋아요를 눌렀습니다.`;
  }
}

export default function NotificationItem({
  notification,
}: NotificationItemProps) {
  return (
    <button
      type="button"
      className={`flex w-full items-start gap-1.5 border-b border-gray-100 px-5 py-4 text-left transition hover:bg-gray-50 ${
        notification.read
          ? "bg-white"
          : "bg-gray-50"
      }`}
    >
      <div className="mt-[7px] flex w-3 shrink-0 justify-center">
        {!notification.read && (
          <span className="h-1.5 w-1.5 rounded-full bg-gray-500" />
        )}
      </div>

      <div className="flex-1">
        <p className="text-sm text-gray-800">
          {getNotificationMessage(notification)}
        </p>
      </div>
    </button>
  );
}