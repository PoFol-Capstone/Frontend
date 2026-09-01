"use server";

import type {
  PagedResponse,
  PostListParams,
  RequestPosts,
  ResponsePosts,
} from "@/types/post";
import { requireSessionUuid } from "./authGuard";
import { http } from "./http.server";

/**
 *
 * @param page?: number | undefined; - 몇 번째 페이지를 가져올지
 * @param size?: number | undefined; - 한 페이지에 몇 개의 항목을 담을지
 * @param type?: PostType | undefined; - Enum: RECRUIT, DISPLAY
 * @param tagId?: number;
 * @param skillId?: number;
 * @param authorUuid?: string; - 사용자 Uuid
 * @returns
 */
export async function getPosts(
  params?: PostListParams,
): Promise<PagedResponse<ResponsePosts>> {
  const res = await http.get<PagedResponse<ResponsePosts>>("/api/posts", {
    params,
  });
  return res.data;
}

export async function createPost(body: RequestPosts): Promise<ResponsePosts> {
  await requireSessionUuid();
  const res = await http.post<ResponsePosts>("/api/posts", body);
  return res.data;
}

export async function getPost(uuid: string): Promise<ResponsePosts> {
  const res = await http.get<ResponsePosts>(`/api/posts/${uuid}`);
  return res.data;
}

export async function updatePost(
  uuid: string,
  body: Partial<RequestPosts>,
): Promise<ResponsePosts> {
  await requireSessionUuid();
  const res = await http.patch<ResponsePosts>(`/api/posts/${uuid}`, body);
  return res.data;
}

export async function deletePost(uuid: string): Promise<void> {
  await requireSessionUuid();
  await http.delete(`/api/posts/${uuid}`);
}

export async function toggleLike(uuid: string): Promise<{ liked: boolean }> {
  await requireSessionUuid();
  const res = await http.post<{ liked: boolean }>(`/api/posts/${uuid}/like`);
  return res.data;
}

export async function toggleBookmark(
  uuid: string,
): Promise<{ bookmarked: boolean }> {
  await requireSessionUuid();
  const res = await http.post<{ bookmarked: boolean }>(
    `/api/posts/${uuid}/bookmark`,
  );
  return res.data;
}

export async function getBookmarkedPosts(): Promise<ResponsePosts[]> {
  await requireSessionUuid();
  const res = await http.get<ResponsePosts[]>("/api/post/bookmarked");
  return res.data;
}

export async function getRelatedPosts(uuid: string): Promise<ResponsePosts[]> {
  const res = await http.get<ResponsePosts[]>(`/api/posts/${uuid}/related`);
  return res.data;
}

export async function getUserPosts(
  authorUuid: string,
  params?: { type?: string; page?: number; size?: number },
): Promise<PagedResponse<ResponsePosts>> {
  const res = await http.get<PagedResponse<ResponsePosts>>(
    `/api/user/${authorUuid}/posts`,
    { params },
  );
  return res.data;
}
