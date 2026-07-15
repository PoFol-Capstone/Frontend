"use server";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { logout as authLogout } from "./auth";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 7일
  path: "/",
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

  cookieStore.set("session", email, COOKIE_OPTIONS);
  cookieStore.set("uuid", uuid, COOKIE_OPTIONS);
  cookieStore.set("access_token", accessToken, COOKIE_OPTIONS);
  cookieStore.set("refresh_token", refreshToken, COOKIE_OPTIONS);
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
}

// GitHub OAuth 후 토큰 갱신 (email은 기존 쿠키 유지)
export async function saveAccessToken(
  uuid: string,
  accessToken: string,
  refreshToken: string,
) {
  const cookieStore = await cookies();

  cookieStore.set("uuid", uuid, COOKIE_OPTIONS);
  cookieStore.set("access_token", accessToken, COOKIE_OPTIONS);
  cookieStore.set("refresh_token", refreshToken, COOKIE_OPTIONS);
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

    const locale = await getLocale();
    redirect({ href: "/", locale });
  }
}
