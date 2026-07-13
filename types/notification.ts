export type NotificationType =
  | "LIKE_POST"
  | "COMMENT_POST"
  | "FOLLOW"
  | "APPLICATION_SUBMITTED"
  | "APPLICATION_ACCEPTED"
  | "APPLICATION_REJECTED";

export type NotificationActor = {
  uuid: string;
  name: string;
};

export type NotificationPost = {
  uuid: string;
  title: string;
} | null;

export type Notification = {
  uuid: string;
  type: NotificationType;
  actor: NotificationActor;
  post: NotificationPost;
  count: number;
  isRead: boolean;
  createdAt: string;
};
