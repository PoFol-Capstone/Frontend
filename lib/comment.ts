"use server";

import type { Comment } from "@/types/comment";
import { http } from "./http.server";

export async function getComments(postUuid: string): Promise<Comment[]> {
  const res = await http.get(`/api/posts/${postUuid}/comments`);
  return res.data;
}

export async function createComment(
  postUuid: string,
  content: string,
  parentUuid?: string,
): Promise<Comment> {
  const res = await http.post(`/api/posts/${postUuid}/comments`, {
    content,
    ...(parentUuid ? { parentUuid } : {}),
  });
  return res.data;
}

export async function updateComment(
  commentUuid: string,
  content: string,
): Promise<Comment> {
  const res = await http.patch(`/api/comments/${commentUuid}`, { content });
  return res.data;
}

export async function toggleCommentLike(
  commentUuid: string,
): Promise<{ liked: boolean }> {
  const res = await http.post(`/api/comments/${commentUuid}/like`);
  return res.data;
}

export async function deleteComment(commentUuid: string): Promise<void> {
  await http.delete(`/api/comments/${commentUuid}`);
}
