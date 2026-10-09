"use server";

import type {
  PagedResponse,
  PostListParams,
  RequestPosts,
  ResponsePosts,
  UpdatePostRequest,
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
    // 학교 필터는 로그인 사용자 기준이다 — 토큰 없이 보내면 백엔드가 빈 목록(200)을 준다
    requireAuth: !!params?.mySchoolOnly,
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
  body: UpdatePostRequest,
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

/**
 * 내 북마크 목록 — 백엔드 `GET /api/posts/bookmarked` → `Page<PostResponse>` (북마크한 순서, 최신 먼저).
 *
 * 이 경로는 공개 GET 규칙(`/api/posts/*`)에 걸려 토큰 없이도 200·빈 목록이 오므로,
 * 토큰을 확보하지 못하면 보내지 않고 401로 실패시킨다(빈 북마크로 보이지 않게).
 */
export async function getBookmarkedPosts(params?: {
  page?: number;
  size?: number;
}): Promise<PagedResponse<ResponsePosts>> {
  await requireSessionUuid();
  const res = await http.get<PagedResponse<ResponsePosts>>(
    "/api/posts/bookmarked",
    { params, requireAuth: true },
  );
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
