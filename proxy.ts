import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

// 로그인이 필요한 경로 (locale prefix 제외한 경로 기준)
const PROTECTED = ["/board", "/settings", "/profile"];

// 로그인 상태에서 접근하면 /board로 보낼 경로
const AUTH_ONLY = ["/login", "/signup"];

// pathname에서 locale prefix를 분리 ("/en/board" -> { localePrefix: "/en", bare: "/board" })
function splitLocale(pathname: string) {
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      const bare = pathname.slice(`/${locale}`.length) || "/";
      return { localePrefix: `/${locale}`, bare };
    }
  }
  return { localePrefix: "", bare: pathname };
}

export function proxy(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;
  const { localePrefix, bare } = splitLocale(pathname);

  const isProtected = PROTECTED.some(
    (p) => bare === p || bare.startsWith(`${p}/`),
  );
  const isAuthOnly = AUTH_ONLY.some(
    (p) => bare === p || bare.startsWith(`${p}/`),
  );

  // 비로그인인데, 보호페이지 접근
  if (isProtected && !session) {
    // 로그인 후 원래 페이지로 돌아오게 callbackUrl 추가
    const url = request.nextUrl.clone();
    url.pathname = `${localePrefix}/login`;
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // 로그인 후, 로그인/회원가입 접근 -> /board로 리턴
  if (isAuthOnly && session) {
    const url = request.nextUrl.clone();
    url.pathname = `${localePrefix}/board`;
    return NextResponse.redirect(url);
  }

  return handleI18nRouting(request);
}

export const config = {
  // 프록시가 실행될 경로 (API, 확장자 있는 정적 파일 전부 제외 - public/icons 등)
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
