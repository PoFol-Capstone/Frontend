"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// ----------------------백 연결 전 임시 로그인
// export async function isLoggedIn() {
//   return true;
// }

/**
 * cookies() : 브라우저 쿠키를 읽고 / 저장하고 / 삭제하는 Next.js 서버용 API
 */

// 로그인 할 때, 저장
export async function saveLogin(email: string, uuid: string, accessToken: string) {
  const cookieStore = await cookies();

  // session 저장
  cookieStore.set("session", email, {
    httpOnly: true, // JS 접근 차단 (XSS 방어)
    secure: process.env.NODE_ENV === "production", // 개발-편함 배포-안전 쿠키사용
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7일
    path: "/",
  });

  // uuid 저장
  cookieStore.set("uuid", uuid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  // access token 저장 (httpOnly: false — 클라이언트 Axios 인터셉터에서도 읽어야 함)
  cookieStore.set("access_token", accessToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
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

// 로그아웃 할 때, 삭제 후 로그인 페이지로 이동
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  cookieStore.delete("access_token");
  redirect("/");
}
