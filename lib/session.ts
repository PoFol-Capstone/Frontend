"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * cookies() : 브라우저 쿠키를 읽고 / 저장하고 / 삭제하는 Next.js 서버용 API
 */

// 로그인 할 때, 저장
export async function saveLogin(email: string) {
  const cookieStore = await cookies();
  cookieStore.set("session", email, {
    httpOnly: true, // JS 접근 차단 (XSS 방어)
    secure: process.env.NODE_ENV === "production", // 개발-편함 배포-안전 쿠키사용
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7일
    path: "/",
  });
}

// 불러오기
export async function getSession() {
  const cookieStore = await cookies();
  return cookieStore.get("session")?.value ?? null;
}

// 로그아웃 할 때, 삭제 후 로그인 페이지로 이동
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/");
}
