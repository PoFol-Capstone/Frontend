import type {
  ApplicantResponse,
  ApplicationStatus,
  ResponsePosts,
} from "@/types/post";

/**
 * 모집글 상태.
 * - CLOSED: 작성자가 마감했거나(비공개 포함) 지원할 포지션이 없다 — 새 지원을 받지 않는다
 * - FULL: 모든 포지션 정원이 찼다 — 작성자가 정원을 늘리거나 마감할 때까지의 상태
 * - RECRUITING: 지원을 받는 중
 */
export type RecruitStatus = "RECRUITING" | "FULL" | "CLOSED";

export function deriveStatus(post: ResponsePosts): RecruitStatus {
  if (!post.isPublished || post.isRecruiting === false) return "CLOSED";
  // 포지션이 하나도 없는 글은 지원할 곳이 없으므로 마감으로 본다
  // (작성·수정 화면이 이제 빈 포지션 게시를 막는다 — 이전에 만들어진 글을 위한 처리)
  if (post.recruitPositionInfos.length === 0) return "CLOSED";
  const allFull = post.recruitPositionInfos.every((p) => p.isFull);
  return allFull ? "FULL" : "RECRUITING";
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
 * 마감은 "수락 가능 여부"에만 적용한다 — 백엔드도 포지션별 정원으로만 수락을 막는다
 * (작성자가 모집을 마감해도 이미 받은 지원서는 수락할 수 있다).
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

export type ApplicantFilter = "ALL" | ApplicationStatus;

export const APPLICANT_FILTERS: ApplicantFilter[] = [
  "ALL",
  "PENDING",
  "ACCEPTED",
  "REJECTED",
];

export function filterApplicants(
  applicants: ApplicantResponse[],
  filter: ApplicantFilter,
): ApplicantResponse[] {
  return filter === "ALL"
    ? applicants
    : applicants.filter((a) => a.status === filter);
}

export function countByStatus(
  applicants: ApplicantResponse[],
): Record<ApplicantFilter, number> {
  const counts: Record<ApplicantFilter, number> = {
    ALL: applicants.length,
    PENDING: 0,
    ACCEPTED: 0,
    REJECTED: 0,
  };
  for (const a of applicants) counts[a.status] += 1;
  return counts;
}

const KNOWN_POSITIONS = ["FRONTEND", "BACKEND", "DESIGNER"] as const;
export type KnownPosition = (typeof KNOWN_POSITIONS)[number];

/** 번역 키가 있는 포지션인지 — 모르는 값(백엔드에 새로 생긴 포지션)은 원문 그대로 보여준다 */
export function isKnownPosition(type: string): type is KnownPosition {
  return (KNOWN_POSITIONS as readonly string[]).includes(type);
}

/**
 * 지원일(백엔드 LocalDateTime, 시간대 없음)을 날짜로 표시.
 * 날짜 부분만 UTC 기준으로 고정해 서버·브라우저 시간대가 달라도 같은 값이 나온다(hydration 불일치 방지).
 */
export function formatAppliedDate(appliedAt: string | null | undefined, locale: string): string {
  const day = appliedAt?.slice(0, 10);
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return "";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00Z`));
}

/** 정원 대비 수락 인원 비율(0~100) — 진행바 너비 */
export function fillPercent(currentCount: number, maxCount: number): number {
  if (maxCount <= 0) return 0;
  return Math.min(100, Math.round((currentCount / maxCount) * 100));
}
