"use server";

import { acceptApplicant, rejectApplicant, setRecruiting } from "@/lib/apply";
import { ApiError } from "@/lib/http.server";
import type { ActionResult } from "@/types/action";
import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";

type ErrorKey = "acceptFailed" | "rejectFailed" | "toggleFailed";

// 백엔드가 거부하는 사유("해당 포지션의 모집이 완료되었습니다", "권한이 없습니다" 등)를
// 사용자에게 그대로 보여줄 수 있도록 예외를 반환값으로 바꿔서 넘긴다.
// 예전에는 `startTransition(() => acceptAction(...))`로만 호출해서 실패가
// unhandled rejection으로 사라지고 화면에는 아무 변화도 없었다.
async function toResult(err: unknown, fallback: ErrorKey): Promise<ActionResult> {
  console.error("[recruitment] 모집 관리 처리 실패:", err);
  if (err instanceof ApiError && err.message) {
    return { ok: false, message: err.message };
  }
  const t = await getTranslations("recruitment.errors");
  return { ok: false, message: t(fallback) };
}

// 경로 패턴으로 무효화해야 /recruitment와 /en/recruitment가 함께 갱신된다
// (예전엔 "/recruitment" 리터럴이라 영어 페이지는 수락 후에도 옛 화면이 남았다)
function revalidateRecruitment() {
  revalidatePath("/[locale]/recruitment", "page");
}

export async function acceptAction(
  postUuid: string,
  applyUuid: string,
): Promise<ActionResult> {
  try {
    await acceptApplicant(postUuid, applyUuid);
  } catch (err) {
    return toResult(err, "acceptFailed");
  }
  revalidateRecruitment();
  return { ok: true };
}

export async function rejectAction(
  postUuid: string,
  applyUuid: string,
): Promise<ActionResult> {
  try {
    await rejectApplicant(postUuid, applyUuid);
  } catch (err) {
    return toResult(err, "rejectFailed");
  }
  revalidateRecruitment();
  return { ok: true };
}

export async function toggleRecruitingAction(
  postUuid: string,
  recruiting: boolean,
): Promise<ActionResult> {
  try {
    await setRecruiting(postUuid, recruiting);
  } catch (err) {
    return toResult(err, "toggleFailed");
  }
  revalidateRecruitment();
  // 게시글 상세의 지원 버튼도 마감 상태를 따라가야 한다
  revalidatePath("/[locale]/board/[id]", "page");
  return { ok: true };
}
