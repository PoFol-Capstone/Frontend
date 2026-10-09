import { decodeJwtPayload, isUuid } from "./jwt";

/**
 * 백엔드 인증 계약을 직접 호출하는 저수준 함수들.
 *
 * proxy.ts(요청 처리 경계)·Route Handler·http.server.ts가 함께 쓴다. 어느 문맥에서도
 * 동작해야 하므로 next/headers나 axios 인스턴스에 의존하지 않고 fetch만 쓰며,
 * 쿠키를 직접 바꾸지 않는다 — 결과를 받은 호출부가 자기 경계에서 쿠키를 쓴다.
 *
 * 실패는 두 종류로 구분한다.
 * - invalid/rejected: 백엔드가 자격증명을 거절함 → 세션을 정리하고 재로그인해야 한다
 * - unavailable: 네트워크·5xx·타임아웃 → 세션은 그대로 두고 일시 장애로 다룬다
 */

const TIMEOUT_MS = 5_000;

function apiUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
}

/** 백엔드가 4xx 인증 계열로 거절했는지. GlobalExceptionHandler는 잘못된 토큰·없는 유저를 400으로 보낸다. */
function isCredentialRejection(status: number) {
  return status === 400 || status === 401 || status === 403;
}

export type RefreshResult =
  | { kind: "ok"; accessToken: string; uuid: string | null }
  | { kind: "invalid" }
  | { kind: "unavailable" };

/** POST /api/auth/refresh — 백엔드는 refresh token을 회전하지 않고 새 access token과 uuid만 준다 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<RefreshResult> {
  let res: Response;
  try {
    res = await fetch(apiUrl("/api/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    console.error("[auth] refresh 요청 실패:", error);
    return { kind: "unavailable" };
  }

  if (isCredentialRejection(res.status)) return { kind: "invalid" };
  if (!res.ok) {
    console.error("[auth] refresh 응답 오류:", res.status);
    return { kind: "unavailable" };
  }

  const data = (await res.json().catch(() => null)) as {
    accessToken?: unknown;
    uuid?: unknown;
  } | null;
  if (typeof data?.accessToken !== "string" || !data.accessToken) {
    console.error("[auth] refresh 응답에 accessToken이 없습니다");
    return { kind: "unavailable" };
  }

  return {
    kind: "ok",
    accessToken: data.accessToken,
    uuid: isUuid(data.uuid) ? data.uuid : null,
  };
}

export type TokenCheck =
  | { kind: "ok"; uuid: string }
  | { kind: "rejected" }
  | { kind: "unavailable" };

/**
 * access token을 백엔드에 제시해 실제로 인증되는지 확인하고, 인증된 사용자의 uuid를 돌려준다.
 *
 * 백엔드에는 `GET /me` 같은 신원 조회 API가 없어서, 인증 필수(`/api/auth/school/**`)이면서
 * 부작용이 없고 유저 존재 여부까지 확인하는(없으면 400) `GET /api/auth/school/status`를 쓴다.
 * 공개 API(`/api/user/{uuid}` 등)는 토큰 없이도 200이므로 인증 확인에 쓸 수 없다.
 *
 * 백엔드가 이 토큰의 서명·만료를 검증하고 받아들였으므로, 같은 토큰의 uuid 클레임은 신뢰할 수 있다.
 */
export async function checkAccessToken(accessToken: string): Promise<TokenCheck> {
  let res: Response;
  try {
    res = await fetch(apiUrl("/api/auth/school/status"), {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    console.error("[auth] 토큰 확인 요청 실패:", error);
    return { kind: "unavailable" };
  }

  // 본문은 쓰지 않는다 — 연결을 붙잡지 않도록 바로 버린다
  await res.body?.cancel().catch(() => {});

  if (isCredentialRejection(res.status)) return { kind: "rejected" };
  if (!res.ok) {
    console.error("[auth] 토큰 확인 응답 오류:", res.status);
    return { kind: "unavailable" };
  }

  const uuid = decodeJwtPayload(accessToken)?.uuid;
  return isUuid(uuid) ? { kind: "ok", uuid } : { kind: "rejected" };
}
