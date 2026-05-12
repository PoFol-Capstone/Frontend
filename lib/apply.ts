"use server";

import type { RequestApplication } from "@/types/post";
import { http } from "./http";

export async function submitApply(postUuid: string, body: RequestApplication): Promise<void> {
  await http.post(`/api/posts/${postUuid}/apply`, body);
}

export async function cancelApply(postUuid: string): Promise<void> {
  await http.delete(`/api/posts/${postUuid}/apply`);
}
