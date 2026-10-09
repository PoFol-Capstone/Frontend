import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from "./tokenConfig";

/**
 * 세션 쿠키 이름·옵션과 쓰기 헬퍼.
 *
 * Next 16에서 쿠키는 Server Function·Route Handler·Proxy에서만 바꿀 수 있다. 이 모듈은
 * 쿠키 저장소를 인자로 받기만 하고 스스로 cookies()를 부르지 않으므로, 세 경계
 * (`cookies()` 저장소, `NextResponse.cookies`) 어디서든 같은 규칙으로 쓸 수 있다.
 * "use server" 파일이 아니라서 여기 있는 함수는 클라이언트가 호출할 수 있는 Server Action이 아니다.
 */

export const SCHOOL_COOKIE = "school";

// session/uuid/refresh_token — refresh token이 살아있는 한 세션도 유지되어야 하므로 동일한 수명 사용
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: REFRESH_TOKEN_MAX_AGE,
  path: "/",
};

// access_token — 실제 JWT 만료 시간과 동일하게
export const ACCESS_TOKEN_COOKIE_OPTIONS = {
  ...SESSION_COOKIE_OPTIONS,
  maxAge: ACCESS_TOKEN_MAX_AGE,
};

const SESSION_COOKIE_NAMES = [
  "session",
  "uuid",
  "access_token",
  "refresh_token",
  SCHOOL_COOKIE,
] as const;

type CookieWriter = {
  set(name: string, value: string, options: typeof SESSION_COOKIE_OPTIONS): unknown;
  delete(name: string): unknown;
};

export function writeSessionCookies(
  store: CookieWriter,
  session: {
    email: string;
    uuid: string;
    accessToken: string;
    refreshToken: string;
  },
) {
  store.set("session", session.email, SESSION_COOKIE_OPTIONS);
  store.set("uuid", session.uuid, SESSION_COOKIE_OPTIONS);
  store.set("access_token", session.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
  store.set("refresh_token", session.refreshToken, SESSION_COOKIE_OPTIONS);
}

/** 백엔드가 새로 발급한 access token과, 그 응답이 알려준 uuid로 세션을 맞춘다 */
export function writeRefreshedAccessToken(
  store: CookieWriter,
  accessToken: string,
  uuid: string | null,
) {
  store.set("access_token", accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
  if (uuid) store.set("uuid", uuid, SESSION_COOKIE_OPTIONS);
}

export function clearSessionCookies(store: CookieWriter) {
  for (const name of SESSION_COOKIE_NAMES) store.delete(name);
}
