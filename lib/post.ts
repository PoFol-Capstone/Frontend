import type {
  PatchApplicationStatus,
  PostListParams,
  RequestApplication,
  RequestPosts,
  ResponseApplication,
  ResponsePosts,
} from "@/types/post";
import { http } from "./http";

export async function getPosts(
  params?: PostListParams,
): Promise<ResponsePosts[]> {
  const res = await http.get("/api/post", { params });
  return res.data;
}

export async function createPost(body: RequestPosts): Promise<ResponsePosts> {
  const res = await http.post("/api/post", body);
  return res.data;
}

export async function getPost(uuid: string): Promise<ResponsePosts> {
  const res = await http.get(`/api/post/${uuid}`);
  return res.data;
}

export async function updatePost(
  uuid: string,
  body: Partial<RequestPosts>,
): Promise<ResponsePosts> {
  const res = await http.patch(`/api/post/${uuid}`, body);
  return res.data;
}

export async function deletePost(uuid: string): Promise<void> {
  await http.delete(`/api/post/${uuid}`);
}

export async function toggleLike(uuid: string): Promise<void> {
  await http.post(`/api/post/${uuid}/like`);
}

export async function toggleBookmark(uuid: string): Promise<void> {
  await http.post(`/api/post/${uuid}/bookmark`);
}

export async function getBookmarkedPosts(): Promise<ResponsePosts[]> {
  const res = await http.get("/api/post/bookmarked");
  return res.data;
}

export async function getRelatedPosts(uuid: string): Promise<ResponsePosts[]> {
  const res = await http.get(`/api/post/${uuid}/related`);
  return res.data;
}

export async function applyToPost(
  uuid: string,
  body: RequestApplication,
): Promise<ResponseApplication> {
  const res = await http.post(`/api/post/${uuid}/applications`, body);
  return res.data;
}

export async function getApplications(
  uuid: string,
): Promise<ResponseApplication[]> {
  const res = await http.get(`/api/post/${uuid}/applications`);
  return res.data;
}

export async function updateApplicationStatus(
  uuid: string,
  applicationId: number,
  body: PatchApplicationStatus,
): Promise<ResponseApplication> {
  const res = await http.patch(
    `/api/post/${uuid}/applications/${applicationId}`,
    body,
  );
  return res.data;
}

export async function getMyApplications(): Promise<ResponseApplication[]> {
  const res = await http.get("/api/user/me/applications");
  return res.data;
}
