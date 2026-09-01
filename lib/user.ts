"use server";

import { Profile, FollowerUser, ProfileUpdateRequest } from "@/types/user";
import { requireSessionUuid } from "./authGuard";
import { http } from "./http.server";

export default async function getUser(uuid: string): Promise<Profile> {
  const res = await http.get<Profile>(`/api/user/${uuid}`);
  return res.data;
}

// 백엔드 FollowController는 `/api/user`(단수)에 매핑돼 있다.
// 예전엔 `/api/users`(복수)로 호출해서 항상 404 → 호출부의 catch(() => [])에 걸려
// 팔로워 목록이 늘 비어 보였다.
export async function getFollowers(uuid: string): Promise<FollowerUser[]> {
  const res = await http.get<FollowerUser[]>(`/api/user/${uuid}/followers`);
  return res.data;
}

export async function followUser(uuid: string): Promise<void> {
  await requireSessionUuid();
  await http.post(`/api/user/${uuid}/follow`);
}

export async function unfollowUser(uuid: string): Promise<void> {
  await requireSessionUuid();
  await http.delete(`/api/user/${uuid}/follow`);
}

export async function updateProfile(data: ProfileUpdateRequest): Promise<void> {
  await requireSessionUuid();
  await http.patch("/api/user/me", data);
}
