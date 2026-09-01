"use server";

import { acceptApplicant, rejectApplicant } from "@/lib/apply";
import { ApiError } from "@/lib/http.server";
import type { ActionResult } from "@/types/action";
import { revalidatePath } from "next/cache";

// 백엔드가 거부하는 사유("해당 포지션의 모집이 완료되었습니다", "권한이 없습니다" 등)를
// 사용자에게 그대로 보여줄 수 있도록 예외를 반환값으로 바꿔서 넘긴다.
// 예전에는 `startTransition(() => acceptAction(...))`로만 호출해서 실패가
// unhandled rejection으로 사라지고 화면에는 아무 변화도 없었다.
function toResult(err: unknown, fallback: string): ActionResult {
  console.error("[recruitment] 지원자 처리 실패:", err);
  return {
    ok: false,
    message: err instanceof ApiError ? err.message : fallback,
  };
}

export async function acceptAction(
  postUuid: string,
  applyUuid: string,
): Promise<ActionResult> {
  try {
    await acceptApplicant(postUuid, applyUuid);
  } catch (err) {
    return toResult(err, "지원자 수락에 실패했습니다.");
  }
  revalidatePath("/recruitment");
  return { ok: true };
}

export async function rejectAction(
  postUuid: string,
  applyUuid: string,
): Promise<ActionResult> {
  try {
    await rejectApplicant(postUuid, applyUuid);
  } catch (err) {
    return toResult(err, "지원자 거절에 실패했습니다.");
  }
  revalidatePath("/recruitment");
  return { ok: true };
}
