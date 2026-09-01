"use server";

import type { Comment } from "@/types/comment";
import { requireSessionUuid } from "./authGuard";
import { http } from "./http.server";

export async function getComments(postUuid: string): Promise<Comment[]> {
  const res = await http.get<Comment[]>(`/api/posts/${postUuid}/comments`);
  return res.data;
}

export async function createComment(
  postUuid: string,
  content: string,
  parentUuid?: string,
): Promise<Comment> {
  await requireSessionUuid();
  const res = await http.post<Comment>(`/api/posts/${postUuid}/comments`, {
    content,
    ...(parentUuid ? { parentUuid } : {}),
  });
  return res.data;
}

export async function updateComment(
  commentUuid: string,
  content: string,
): Promise<Comment> {
  await requireSessionUuid();
  const res = await http.patch<Comment>(`/api/comments/${commentUuid}`, {
    content,
  });
  return res.data;
}

export async function toggleCommentLike(
  commentUuid: string,
): Promise<{ liked: boolean }> {
  await requireSessionUuid();
  const res = await http.post<{ liked: boolean }>(
    `/api/comments/${commentUuid}/like`,
  );
  return res.data;
}

export async function deleteComment(commentUuid: string): Promise<void> {
  await requireSessionUuid();
  await http.delete(`/api/comments/${commentUuid}`);
}
