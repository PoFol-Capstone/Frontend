"use server";

import { ApiError } from "@/lib/http.server";
import { deletePost } from "@/lib/post";
import type { ActionResult } from "@/types/action";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

/**
 * 성공하면 /board로 리다이렉트하므로 값을 반환하지 않는다(`undefined`).
 * 실패했을 때만 사유를 담은 `ActionResult`를 돌려준다.
 */
export async function deletePostAction(
  uuid: string,
): Promise<ActionResult | undefined> {
  try {
    await deletePost(uuid);
  } catch (err) {
    // redirect()는 내부적으로 예외를 던지므로 try 블록 밖에서 호출해야 한다.
    // (같은 try에 넣으면 정상 리다이렉트가 실패로 잡힌다)
    console.error("[board] 게시글 삭제 실패:", err);
    return {
      ok: false,
      message:
        err instanceof ApiError ? err.message : "게시글 삭제에 실패했습니다.",
    };
  }

  redirect({ href: "/board", locale: await getLocale() });
}
