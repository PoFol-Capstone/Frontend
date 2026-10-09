import type { RecruitPositionRequest } from "@/types/post";

/**
 * 모집 포지션 — 화면 표시명과 백엔드 PositionType(FRONTEND·BACKEND·DESIGNER).
 *
 * 예전엔 포지션을 하나도 고르지 않아도 모집글을 게시할 수 있었다. 그러면 지원 화면에 고를
 * 포지션이 없고, 모집 관리에서는 `every([])`가 true라 바로 "마감"으로 보였다.
 * 작성·수정의 단계 이동과 최종 제출에서 이 검사를 통과해야 한다.
 */
export const RECRUIT_ROLES = ["Frontend", "Backend", "Designer"] as const;

export type RecruitRole = (typeof RECRUIT_ROLES)[number];

/** 정원 상한 — 비정상 입력이 그대로 저장되지 않게 한다 */
export const MAX_ROLE_COUNT = 99;

function isRecruitRole(role: string): role is RecruitRole {
  return (RECRUIT_ROLES as readonly string[]).includes(role);
}

function isValidCount(count: unknown): count is number {
  return (
    typeof count === "number" &&
    Number.isInteger(count) &&
    count >= 1 &&
    count <= MAX_ROLE_COUNT
  );
}

/** 알 수 없는 포지션·0 이하 정원 없이, 유효한 포지션이 하나 이상 있는지 */
export function hasValidRecruitPositions(
  roleCounts: Record<string, number>,
): boolean {
  const entries = Object.entries(roleCounts);
  return (
    entries.length > 0 &&
    entries.every(([role, count]) => isRecruitRole(role) && isValidCount(count))
  );
}

/** 화면 상태 → 백엔드 요청. 검사를 통과한 값만 넘겨야 한다. */
export function toRecruitPositionRequests(
  roleCounts: Record<string, number>,
): RecruitPositionRequest[] {
  return Object.entries(roleCounts)
    .filter(([role, count]) => isRecruitRole(role) && isValidCount(count))
    .map(([role, count]) => ({
      positionType: role.toUpperCase(),
      maxCount: count,
    }));
}

/** 백엔드 응답(FRONTEND) → 화면 상태 키(Frontend) */
export function toRoleCounts(
  positions: { positionType: string; maxCount: number }[],
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const p of positions) {
    const display =
      p.positionType.charAt(0) + p.positionType.slice(1).toLowerCase();
    result[display] = p.maxCount;
  }
  return result;
}
