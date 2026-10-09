"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "@/lib/notification";
import {
  createNotificationListStore,
  initialNotificationListState,
} from "./notificationList";

const POLL_INTERVAL_MS = 30000;

export function useNotifications(isLoggedIn: boolean) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [store] = useState(() =>
    createNotificationListStore((page) => getNotifications(page)),
  );
  const list = useSyncExternalStore(
    store.subscribe,
    store.getState,
    () => initialNotificationListState,
  );

  // 응답이 온 뒤 콜백에서만 상태를 바꾼다 (effect에서 동기적으로 setState하지 않음)
  const refreshUnreadCount = useCallback(() => {
    getUnreadCount().then(setUnreadCount, () => {
      // 폴링 실패는 조용히 무시 — 다음 주기에 재시도
    });
  }, []);

  // 로그인 상태에서만, 탭이 보이는 동안 30초마다 안읽음 개수 폴링 (WebSocket 없이 폴링 전략)
  useEffect(() => {
    if (!isLoggedIn) return;

    refreshUnreadCount();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") refreshUnreadCount();
    }, POLL_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") refreshUnreadCount();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isLoggedIn, refreshUnreadCount]);

  /** 알림창을 열 때마다 호출 — 목록과 안읽음 개수를 함께 최신으로 맞춘다 */
  const refresh = useCallback(() => {
    void store.reload();
    refreshUnreadCount();
  }, [store, refreshUnreadCount]);

  const loadMore = useCallback(() => {
    void store.loadMore();
  }, [store]);

  const retry = useCallback(() => {
    void store.retry();
  }, [store]);

  const markOneRead = useCallback(
    async (uuid: string) => {
      store.markRead(uuid);
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await markAsRead(uuid);
      } catch {
        // 실패해도 롤백하지 않음 — 다음 목록 새로고침 때 서버 상태로 정정
      }
    },
    [store],
  );

  const markAllRead = useCallback(async () => {
    store.markAllRead();
    setUnreadCount(0);

    try {
      await markAllAsRead();
    } catch {
      // 실패해도 롤백하지 않음 — 다음 목록 새로고침 때 서버 상태로 정정
    }
  }, [store]);

  return {
    unreadCount,
    notifications: list.items,
    hasMore: list.hasMore,
    isLoading: list.isLoading,
    loadError: list.error,
    refresh,
    loadMore,
    retry,
    markOneRead,
    markAllRead,
  };
}
