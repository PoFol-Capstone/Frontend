import { requireSessionUuid } from "./authGuard";
import { ApiError } from "./http.server";

/**
 * 클라이언트 컴포넌트가 부르는 Server Function의 결과 형식.
 * 예외를 던지면 프로덕션에서 메시지가 가려지므로, 세션 확인·백엔드 실패를 값으로 돌려줘
 * 호출부가 status(409·429 등)로 문구를 고르게 한다.
 */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number | null; error: string };

export async function attempt<T>(run: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    await requireSessionUuid();
    return { ok: true, data: await run() };
  } catch (err) {
    if (err instanceof ApiError) {
      return { ok: false, status: err.status ?? null, error: err.message };
    }
    return {
      ok: false,
      status: null,
      error: err instanceof Error ? err.message : "요청 처리 중 오류가 발생했습니다.",
    };
  }
}
