import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { AuthResponse } from "@/types/auth";
import { decodeJwtPayload } from "@/lib/jwt";
import { syncSchoolCookie } from "@/lib/school";
import { writeSessionCookies } from "@/lib/sessionCookies";

const BINDING_COOKIE = "oauth_binding";

/**
 * GitHub 로그인 마지막 단계 — proxy가 /oauth/callback?code= 를 여기로 보낸다.
 *
 * 백엔드 교환 코드(1분 · 1회)는 로그인을 시작한 브라우저의 oauth_binding 쿠키와 함께여야만
 * 토큰으로 바뀐다. 쿠키 path가 /api/auth/github라서 이 경로에서만 실려 오므로 여기서 교환한다.
 * 로그인하면서 GitHub 토큰도 백엔드 social_account에 저장되어 레포 연동까지 끝난다.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const binding = req.cookies.get(BINDING_COOKIE)?.value;
  const fail = () => {
    const res = NextResponse.redirect(new URL("/login?error=github", req.url));
    res.cookies.set(BINDING_COOKIE, "", { path: "/api/auth/github", maxAge: 0 });
    return res;
  };
  if (!code || !binding) return fail();

  let auth: AuthResponse;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/github/exchange`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${BINDING_COOKIE}=${binding}`,
      },
      body: JSON.stringify({ code }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("[github/finish] 교환 실패:", res.status);
      return fail();
    }
    auth = (await res.json()) as AuthResponse;
  } catch (error) {
    console.error("[github/finish] 교환 요청 오류:", error);
    return fail();
  }

  // 백엔드가 방금 이 서버에 직접 발급한 토큰이라 서명 검증 없이 sub(이메일)만 읽는다
  const email = decodeJwtPayload(auth.accessToken)?.sub;
  if (typeof email !== "string" || !email || !auth.uuid || !auth.refreshToken) return fail();

  writeSessionCookies(await cookies(), {
    email,
    uuid: auth.uuid,
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
  });
  try {
    await syncSchoolCookie();
  } catch (error) {
    // 학교명은 헤더 표시용 — 실패해도 로그인은 성공시킨다 (lib/auth.ts와 같은 규칙)
    console.error("[github/finish] school cookie sync failed:", error);
  }

  const res = NextResponse.redirect(new URL("/profile", req.url));
  res.cookies.set(BINDING_COOKIE, "", { path: "/api/auth/github", maxAge: 0 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
