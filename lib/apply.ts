"use server";

import type {
  ApplicantResponse,
  RequestApplication,
  ResponseApplication,
} from "@/types/post";
import { getOptionalSessionUuid, requireSessionUuid } from "./authGuard";
import { http } from "./http.server";

/**
 * 로그인한 사용자의 이 게시글 지원서. 지원하지 않았으면 null.
 *
 * 백엔드가 "지원 내역이 없습니다"를 `RuntimeException`으로 던져서 500으로 내려오기 때문에
 * status만으로는 "미지원"과 "실제 장애"를 구분할 수 없다. 그래서 예외는 계속 null로
 * 흡수하되, 원인을 추적할 수 있도록 서버 로그는 남긴다.
 * (예전에는 아무 로그도 없이 통째로 삼켜서 장애가 조용히 묻혔다.)
 */
export async function getApply(
  postUuid: string,
): Promise<ResponseApplication | null> {
  // 비로그인 사용자는 애초에 지원서가 있을 수 없다 — 헛된 401을 만들지 않는다.
  if (!(await getOptionalSessionUuid())) return null;

  try {
    const res = await http.get<ResponseApplication>(
      `/api/posts/${postUuid}/apply`,
    );
    return res.data;
  } catch (err) {
    console.info(
      "[apply] getApply 미지원 또는 조회 실패:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

export async function submitApply(
  postUuid: string,
  body: RequestApplication,
): Promise<ResponseApplication> {
  await requireSessionUuid();
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
  await requireSessionUuid();
  const res = await http.put<ResponseApplication>(
    `/api/posts/${postUuid}/apply`,
    body,
  );
  return res.data;
}

export async function cancelApply(postUuid: string): Promise<void> {
  await requireSessionUuid();
  await http.delete(`/api/posts/${postUuid}/apply`);
}

/**
 * 게시글 지원자 목록 (작성자 전용).
 *
 * 작성자가 아니면 백엔드가 거부하므로 빈 배열로 흡수하되, 조용히 사라지지 않도록 로그를 남긴다.
 */
export async function getApplicants(
  postUuid: string,
): Promise<ApplicantResponse[]> {
  await requireSessionUuid();
  try {
    const res = await http.get<ApplicantResponse[]>(
      `/api/posts/${postUuid}/applicants`,
    );
    return res.data;
  } catch (err) {
    console.error(
      "[apply] getApplicants 실패:",
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

export async function acceptApplicant(
  postUuid: string,
  applyUuid: string,
): Promise<void> {
  await requireSessionUuid();
  await http.put(`/api/posts/${postUuid}/applicants/${applyUuid}/accept`);
}

export async function rejectApplicant(
  postUuid: string,
  applyUuid: string,
): Promise<void> {
  await requireSessionUuid();
  await http.put(`/api/posts/${postUuid}/applicants/${applyUuid}/reject`);
}
