"use server";

import type { RequestApplication, ResponseApplication } from "@/types/post";
import { http } from "./http";

export async function getApply(
  postUuid: string,
): Promise<ResponseApplication | null> {
  try {
    const res = await http.get<ResponseApplication>(
      `/api/posts/${postUuid}/apply`,
    );
    return res.data;
  } catch {
    return null;
  }
}

export async function submitApply(
  postUuid: string,
  body: RequestApplication,
): Promise<ResponseApplication> {
  const res = await http.post<ResponseApplication>(
    `/api/posts/${postUuid}/apply`,
    body,
  );
  return res.data;
}

export async function updateApply(
  postUuid: string,
  body: { introduction: string; portfolioUrl?: string },
): Promise<ResponseApplication> {
  const res = await http.put<ResponseApplication>(
    `/api/posts/${postUuid}/apply`,
    body,
  );
  return res.data;
}

export async function cancelApply(postUuid: string): Promise<void> {
  await http.delete(`/api/posts/${postUuid}/apply`);
}
