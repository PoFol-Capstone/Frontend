"use server";

import type {
  ApplicantResponse,
  RequestApplication,
  ResponseApplication,
  ResponsePosts,
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
 * 내 모집글 전체 — 백엔드 모집 관리 전용 API `GET /api/recruitment/posts` (공개된 RECRUIT 글, 최신순).
 *
 * 예전엔 프로필용 `/api/user/{uuid}/posts`를 기본 page size(4)로 불러서 5번째 모집글부터는
 * 모집 관리에서 볼 수 없었다. 이 API는 페이지 없이 목록 전체와 포지션별 수락 인원을 준다.
 */
export async function getMyRecruitPosts(): Promise<ResponsePosts[]> {
  await requireSessionUuid();
  const res = await http.get<ResponsePosts[]>("/api/recruitment/posts", {
    requireAuth: true,
  });
  return res.data;
}

/**
 * 게시글 지원자 목록 (작성자 전용).
 *
 * 예전엔 실패를 빈 배열로 흡수해서 서버 장애·인증 오류가 "지원자 없음"으로 보였다.
 * 이제 실패는 그대로 던져 호출부가 오류 화면(재시도)이나 재로그인으로 처리한다.
 * 남의 글 uuid로 부르지 않도록 호출부가 내 모집글 목록에 있는 글만 넘긴다.
 */
export async function getApplicants(
  postUuid: string,
): Promise<ApplicantResponse[]> {
  await requireSessionUuid();
  const res = await http.get<ApplicantResponse[]>(
    `/api/posts/${postUuid}/applicants`,
    { requireAuth: true },
  );
  return res.data;
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
