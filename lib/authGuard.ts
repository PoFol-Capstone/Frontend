import { cookies } from "next/headers";
import { ApiError } from "./http.server";

/**
 * Server Function 진입점에서 로그인 여부를 확인한다.
 *
 * 백엔드는 이미 `@AuthenticationPrincipal`로 뽑은 userId로 소유권을 검증하므로
 * 클라이언트가 보낸 uuid만으로 남의 리소스를 조작할 수는 없다. 이 가드는 그 대신
 *
 * 1. AGENTS.md의 "모든 Server Function 내부에서 인증을 검증하라" 규칙을 지키고
 *    (`proxy.ts` matcher는 Server Function 호출을 보호해주지 않는다),
 * 2. 자격증명 없는 요청을 백엔드까지 보내지 않고 즉시 끊고,
 * 3. 실패를 401 `ApiError`로 통일해서 호출부가 만료 세션을 일관되게 처리하게 한다.
 *
 * 는 목적을 갖는다.
 *
 * @throws ApiError status 401 — 세션 쿠키가 없을 때
 */
export async function requireSessionUuid(): Promise<string> {
  const uuid = await getOptionalSessionUuid();
  if (!uuid) {
    throw new ApiError(401, "로그인이 필요합니다.");
  }
  return uuid;
}

/** 로그인 상태에 따라 동작이 갈리는 조회용 — 없으면 null */
export async function getOptionalSessionUuid(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("uuid")?.value ?? null;
}
