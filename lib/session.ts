"use server";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { logout as authLogout } from "./auth";
import { clearSchoolCookie, syncSchoolCookie } from "./school";
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from "./tokenConfig";

// session/uuid/refresh_token — refresh token이 살아있는 한 세션도 유지되어야 하므로 동일한 수명 사용
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: REFRESH_TOKEN_MAX_AGE,
  path: "/",
};

// access_token — 실제 JWT 만료 시간과 동일하게
const ACCESS_TOKEN_COOKIE_OPTIONS = {
  ...SESSION_COOKIE_OPTIONS,
  maxAge: ACCESS_TOKEN_MAX_AGE,
};

// 로그인 할 때, 저장
export async function saveLogin(
  email: string,
  uuid: string,
  accessToken: string,
  refreshToken: string,
) {
  /**
   * cookies() : 브라우저 쿠키를 읽고 / 저장하고 / 삭제하는 Next.js 서버용 API
   */
  const cookieStore = await cookies();

  cookieStore.set("session", email, SESSION_COOKIE_OPTIONS);
  cookieStore.set("uuid", uuid, SESSION_COOKIE_OPTIONS);
  cookieStore.set("access_token", accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
  cookieStore.set("refresh_token", refreshToken, SESSION_COOKIE_OPTIONS);

  await syncSchoolNameQuietly();
}

/**
 * 헤더에 "PoFol | 강남대"를 띄우기 위한 학교명 쿠키를 심는다.
 *
 * 페이지마다 백엔드를 왕복하지 않으려고 로그인 시점에 한 번만 조회한다.
 * 학교 조회가 실패해도 로그인 자체는 성공시켜야 하므로 삼킨다.
 */
async function syncSchoolNameQuietly() {
  try {
    await syncSchoolCookie();
  } catch (error) {
    console.error("school cookie sync failed:", error);
  }
}

// 불러오기
export async function getSession() {
  const cookieStore = await cookies();
  return cookieStore.get("session")?.value ?? null;
}

// get uuid
export async function getSessionUuid() {
  const cookieStore = await cookies();
  return cookieStore.get("uuid")?.value ?? null;
}

// 세션 쿠키만 제거 (서버 로그아웃 API 호출 없이) — 만료/무효 세션 정리 후 재로그인 유도할 때 사용
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  cookieStore.delete("uuid");
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  await clearSchoolCookie();
}

// GitHub OAuth 후 토큰 갱신 (email은 기존 쿠키 유지)
export async function saveAccessToken(
  uuid: string,
  accessToken: string,
  refreshToken: string,
) {
  const cookieStore = await cookies();

  cookieStore.set("uuid", uuid, SESSION_COOKIE_OPTIONS);
  cookieStore.set("access_token", accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
  cookieStore.set("refresh_token", refreshToken, SESSION_COOKIE_OPTIONS);

  await syncSchoolNameQuietly();
}

// 로그아웃 할 때, 삭제 후 로그인 페이지로 이동
export async function logout() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  try {
    if (refreshToken) {
      await authLogout(refreshToken);
    }
  } catch (error) {
    console.error("logout failed:", error);
  } finally {
    cookieStore.delete("session");
    cookieStore.delete("uuid");
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
    await clearSchoolCookie();

    const locale = await getLocale();
    redirect({ href: "/", locale });
  }
}
