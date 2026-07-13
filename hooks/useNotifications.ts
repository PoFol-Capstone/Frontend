"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "@/lib/notification";
import type { Notification } from "@/types/notification";

const POLL_INTERVAL_MS = 30000;

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshUnreadCount = useCallback(async () => {
    try {
      setUnreadCount(await getUnreadCount());
    } catch {
      // 폴링 실패는 조용히 무시 — 다음 주기에 재시도
    }
  }, []);

  // 탭이 보이는 동안만 30초마다 안읽음 개수 폴링 (WebSocket 없이 폴링 전략)
  useEffect(() => {
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
  }, [refreshUnreadCount]);

  const loadFirstPage = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getNotifications(0);
      setNotifications(data.content);
      setPage(0);
      setHasMore(!data.last);
      setIsLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const data = await getNotifications(nextPage);
      setNotifications((prev) => [...prev, ...data.content]);
      setPage(nextPage);
      setHasMore(!data.last);
    } finally {
      setIsLoading(false);
    }
  }, [page, hasMore, isLoading]);

  const markOneRead = useCallback(async (uuid: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.uuid === uuid ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markAsRead(uuid);
    } catch {
      // 실패해도 롤백하지 않음 — 다음 목록 새로고침 때 서버 상태로 정정
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await markAllAsRead();
    } catch {
      // 실패해도 롤백하지 않음 — 다음 목록 새로고침 때 서버 상태로 정정
    }
  }, []);

  return {
    unreadCount,
    notifications,
    hasMore,
    isLoading,
    isLoaded,
    loadFirstPage,
    loadMore,
    markOneRead,
    markAllRead,
  };
}
