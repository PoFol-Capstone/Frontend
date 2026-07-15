import type { ResponsePosts } from "@/types/post";

export type RecruitStatus = "CLOSED" | "RECRUITING";

export function deriveStatus(post: ResponsePosts): RecruitStatus {
  if (!post.isPublished) return "CLOSED";
  const allFull = post.recruitPositionInfos.every((p) => p.isFull);
  return allFull ? "CLOSED" : "RECRUITING";
}
