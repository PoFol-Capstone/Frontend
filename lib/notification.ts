"use server";

import type { Notification } from "@/types/notification";
import type { PagedResponse } from "@/types/post";
import { http } from "./http.server";

export async function getNotifications(
  page = 0,
  size = 20,
): Promise<PagedResponse<Notification>> {
  const res = await http.get("/api/notifications", { params: { page, size } });
  return res.data;
}

export async function getUnreadCount(): Promise<number> {
  const res = await http.get<{ count: number }>("/api/notifications/count");
  return res.data.count;
}

export async function markAsRead(uuid: string): Promise<void> {
  await http.patch(`/api/notifications/${uuid}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await http.patch("/api/notifications/read-all");
}
