"use server";

import type { Notification } from "@/types/notification";
import type { PagedResponse } from "@/types/post";
import { ApiError, http } from "./http.server";

export async function getNotifications(
  page = 0,
  size = 20,
): Promise<PagedResponse<Notification>> {
  const res = await http.get("/api/notifications", { params: { page, size } });
  return res.data;
}

export async function getUnreadCount(): Promise<number> {
  try {
    const res = await http.get<{ count: number }>("/api/notifications/count");
    return res.data.count;
  } catch (err) {
    // 세션 만료 등으로 인증이 끊긴 상태의 백그라운드 폴링 — 사용자 작업을 막지 않고 조용히 0으로 처리
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      return 0;
    }
    throw err;
  }
}

export async function markAsRead(uuid: string): Promise<void> {
  await http.patch(`/api/notifications/${uuid}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await http.patch("/api/notifications/read-all");
}
