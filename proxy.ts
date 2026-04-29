import { NextRequest, NextResponse } from "next/server";

// 로그인이 필요한 경로
const PROTECTED = ["/board", "/settings", "/profile"];

// 로그인 상태에서 접근하면 /board로 보낼 경로
const AUTH_ONLY = ["/login", "/signup"];

export function proxy(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY.some((p) => pathname.startsWith(p));

  // 비로그인인데, 보호페이지 접근
  if (isProtected && !session) {
    // 로그인 후 원래 페이지로 돌아오게 callbackUrl 추가
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // 로그인 후, 로그인/회원가입 접근 -> /board로 리턴
  if (isAuthOnly && session) {
    return NextResponse.redirect(new URL("/board", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // 미들웨어가 실행될 경로 (정적 파일, API 제외)
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
