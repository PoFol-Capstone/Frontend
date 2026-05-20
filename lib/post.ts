"use server";

import type {
  PagedResponse,
  PostListParams,
  RequestPosts,
  ResponsePosts,
} from "@/types/post";
import { http } from "./http";

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
  const res = await http.get("/api/posts", { params });
  return res.data;
}

export async function createPost(body: RequestPosts): Promise<ResponsePosts> {
  const res = await http.post("/api/posts", body);
  return res.data;
}

export async function getPost(uuid: string): Promise<ResponsePosts> {
  const res = await http.get(`/api/posts/${uuid}`);
  return res.data;
}

export async function updatePost(
  uuid: string,
  body: Partial<RequestPosts>,
): Promise<ResponsePosts> {
  const res = await http.patch(`/api/posts/${uuid}`, body);
  return res.data;
}

export async function deletePost(uuid: string): Promise<void> {
  await http.delete(`/api/posts/${uuid}`);
}

export async function toggleLike(uuid: string): Promise<void> {
  await http.post(`/api/posts/${uuid}/like`);
}

export async function toggleBookmark(uuid: string): Promise<void> {
  await http.post(`/api/posts/${uuid}/bookmark`);
}

export async function getBookmarkedPosts(): Promise<ResponsePosts[]> {
  const res = await http.get("/api/post/bookmarked");
  return res.data;
}

export async function getRelatedPosts(uuid: string): Promise<ResponsePosts[]> {
  const res = await http.get(`/api/posts/${uuid}/related`);
  return res.data;
}
