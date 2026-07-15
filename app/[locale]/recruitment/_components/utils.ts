import type { ResponsePosts } from "@/types/post";

export function deriveStatus(post: ResponsePosts): string {
  if (!post.isPublished) return "마감";
  const allFull = post.recruitPositionInfos.every((p) => p.isFull);
  return allFull ? "마감" : "모집중";
}
