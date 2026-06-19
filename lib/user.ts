"use server";

import { Profile, FollowerUser, ProfileUpdateRequest } from "@/types/user";
import { http } from "./http.server";

export default async function getUser(uuid: string): Promise<Profile> {
  const res = await http.get(`/api/user/${uuid}`);
  return res.data;
}

export async function getFollowers(
  uuid: string,
): Promise<FollowerUser[]> {
  const res = await http.get(`/api/users/${uuid}/followers`);
  return res.data;
}

export async function followUser(uuid: string): Promise<void> {
  await http.post(`/api/user/${uuid}/follow`);
}

export async function unfollowUser(uuid: string): Promise<void> {
  await http.delete(`/api/user/${uuid}/follow`);
}

export async function updateProfile(data: ProfileUpdateRequest): Promise<void> {
  await http.patch("/api/user/me", data);
}