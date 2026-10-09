/**
 * 서명 검증 없이 JWT payload만 읽는다.
 *
 * FE는 백엔드의 서명 키를 갖고 있지 않으므로 여기서 읽은 값은 그 자체로 신뢰할 수 없다.
 * - 만료 시각(exp)은 "갱신을 먼저 시도할지" 정하는 힌트로만 쓴다.
 * - 신원(uuid)은 백엔드가 같은 토큰을 받아들인 것을 확인한 뒤에만 쓴다 (lib/backendAuth.ts).
 *
 * proxy(Node)·Route Handler·브라우저 어디서든 돌도록 Buffer 대신 atob/TextDecoder를 쓴다.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

// 백엔드와 시계가 조금 어긋나도 만료 직전 토큰을 보내 403을 받지 않도록 여유를 둔다
const EXPIRY_SKEW_MS = 30_000;

/** exp가 지났거나(여유 30초 포함) 읽을 수 없는 토큰이면 true */
export function isJwtExpired(token: string, nowMs = Date.now()): boolean {
  const exp = decodeJwtPayload(token)?.exp;
  if (typeof exp !== "number") return true;
  return exp * 1000 <= nowMs + EXPIRY_SKEW_MS;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}
