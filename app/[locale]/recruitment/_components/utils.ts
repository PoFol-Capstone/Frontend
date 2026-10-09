import type { ApplicantResponse, ResponsePosts } from "@/types/post";

export type RecruitStatus = "CLOSED" | "RECRUITING";

export function deriveStatus(post: ResponsePosts): RecruitStatus {
  if (!post.isPublished) return "CLOSED";
  // 포지션이 하나도 없는 글은 지원할 곳이 없으므로 마감으로 본다
  // (작성·수정 화면이 이제 빈 포지션 게시를 막는다 — 이전에 만들어진 글을 위한 처리)
  if (post.recruitPositionInfos.length === 0) return "CLOSED";
  const allFull = post.recruitPositionInfos.every((p) => p.isFull);
  return allFull ? "CLOSED" : "RECRUITING";
}

export type ApplicantActions = {
  /** 대기 중이고, 지원한 포지션에 아직 자리가 있을 때만 수락할 수 있다 */
  canAccept: boolean;
  /** 대기 중이면 마감 여부와 상관없이 거절할 수 있다 */
  canReject: boolean;
  /** 지원한 포지션의 정원이 찼는지 (수락 버튼 대신 안내를 보여준다) */
  positionFull: boolean;
};

/**
 * 지원자 카드에서 가능한 처리.
 *
 * 예전엔 글 전체가 마감(모든 포지션 정원 참)이면 상태·포트폴리오·거절 버튼까지 통째로 숨겨서,
 * 마지막 정원을 수락하는 순간 남은 지원자를 거절할 수도, 누가 수락됐는지 볼 수도 없었다.
 * 마감은 "수락 가능 여부"에만 적용한다 — 백엔드도 포지션별 정원으로만 수락을 막는다.
 */
export function getApplicantActions(
  applicant: ApplicantResponse,
  post: ResponsePosts | undefined,
): ApplicantActions {
  const isPending = applicant.status === "PENDING";
  const position = post?.recruitPositionInfos.find(
    (p) => p.positionType === applicant.positionType,
  );
  // 포지션 정보가 없으면(삭제·변경된 포지션) 수락할 자리가 없는 것으로 본다
  const positionFull = !position || position.isFull;

  return {
    canAccept: isPending && !!post?.isPublished && !positionFull,
    canReject: isPending,
    positionFull,
  };
}
