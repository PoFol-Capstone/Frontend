"use server";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { logout as authLogout } from "./auth";
import { clearSessionCookies } from "./sessionCookies";

// 로그인 쿠키를 쓰는 함수는 여기 두지 않는다. 이 파일은 "use server"라서 export한 함수가 전부
// 클라이언트에서 호출 가능한 Server Action이 되는데, 예전 saveLogin/saveAccessToken은 호출자가 준
// 토큰·uuid를 그대로 세션으로 저장했다(OAuth 콜백 URL로 계정 바꿔치기가 가능했던 경로).
// 로그인 완료는 lib/auth.ts가 백엔드 응답으로 직접 쿠키를 쓴다.

// 불러오기 — proxy가 같은 요청에서 지운 쿠키는 빈 문자열로 보이므로 null로 맞춘다
export async function getSession() {
  const cookieStore = await cookies();
  return cookieStore.get("session")?.value || null;
}

// get uuid — 화면 분기(본인 여부 등)용. 서명되지 않은 값이라 인가·호출 제한에는 쓰지 않는다
export async function getSessionUuid() {
  const cookieStore = await cookies();
  return cookieStore.get("uuid")?.value || null;
}

// 세션 쿠키만 제거 (서버 로그아웃 API 호출 없이) — 만료/무효 세션 정리 후 재로그인 유도할 때 사용
export async function clearSession() {
  clearSessionCookies(await cookies());
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
    clearSessionCookies(cookieStore);

    const locale = await getLocale();
    redirect({ href: "/", locale });
  }
}
