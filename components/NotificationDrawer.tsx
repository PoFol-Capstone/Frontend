"use client";

import NotificationItem from "./NotificationItem";
import type { Notification } from "@/types/notification";

type NotificationDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onItemRead: (uuid: string) => void;
  onMarkAllRead: () => void;
};

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  isLoading,
  hasMore,
  onLoadMore,
  onItemRead,
  onMarkAllRead,
}: NotificationDrawerProps) {
  return (
    <div
      className={`fixed inset-0 z-50 transition ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        className={`fixed right-0 top-0 z-50 flex h-dvh w-[80vw] max-w-95 flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-black">알림</h2>

            <p className="text-sm text-gray-500">
              읽지 않은 알림 {unreadCount}개
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-gray-400">
                {isLoading ? "불러오는 중..." : "모든 알림을 확인했습니다."}
              </p>
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.uuid}
                  notification={notification}
                  onRead={onItemRead}
                />
              ))}

              {hasMore && (
                <div className="flex justify-center py-4">
                  <button
                    type="button"
                    onClick={onLoadMore}
                    disabled={isLoading}
                    className="text-sm font-medium text-gray-500 transition hover:text-black disabled:opacity-50"
                  >
                    {isLoading ? "불러오는 중..." : "더보기"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-center border-t border-gray-200 p-4">
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-sm font-medium text-gray-600 transition hover:text-black"
          >
            모두 읽음으로 표시
          </button>
        </div>
      </aside>
    </div>
  );
}
