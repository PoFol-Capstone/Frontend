import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { refreshAccessToken } from "@/lib/backendAuth";
import { isJwtExpired } from "@/lib/jwt";
import {
  clearSessionCookies,
  writeRefreshedAccessToken,
} from "@/lib/sessionCookies";

const handleI18nRouting = createMiddleware(routing);

// 로그인이 필요한 경로 (locale prefix 제외한 경로 기준)
const PROTECTED = ["/board", "/settings", "/profile", "/recruitment", "/bookmark"];

// 로그인 상태에서 접근하면 /board로 보낼 경로
const AUTH_ONLY = ["/login", "/signup"];

// 백엔드 GitHub 로그인 콜백은 일회성 교환 코드(?code=) 또는 ?error=를 실어 여기로 보낸다.
// 코드는 시작 브라우저의 oauth_binding 쿠키와 함께여야 토큰이 되는데, 그 쿠키는 path가
// /api/auth/github라 이 페이지엔 실리지 않는다 — 교환은 /api/auth/github/finish가 한다.
const OAUTH_CALLBACK = "/oauth/callback";

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

function matches(bare: string, paths: string[]) {
  return paths.some((p) => bare === p || bare.startsWith(`${p}/`));
}

type SessionUpdate =
  | { kind: "unchanged" }
  | { kind: "refreshed"; accessToken: string; uuid: string | null }
  | { kind: "cleared" };

/**
 * 페이지·Server Action 요청이 렌더되기 전에 access token을 확보한다.
 *
 * Server Component 렌더 중에는 쿠키를 쓸 수 없어서(Next 16) 예전엔 렌더 도중 갱신한 토큰을
 * 저장하다 예외가 나 갱신 자체가 실패했고, 공개 GET은 토큰이 없으면 익명 200을 돌려줘서
 * 갱신이 시작조차 안 됐다(좋아요·북마크·팔로우 상태 유실). Proxy는 쿠키를 쓸 수 있는
 * 요청 처리 경계이고, 여기서 응답에 심은 쿠키는 같은 요청의 `cookies()`에도 반영된다.
 */
async function ensureFreshAccessToken(request: NextRequest): Promise<SessionUpdate> {
  const refreshToken = request.cookies.get("refresh_token")?.value;
  if (!refreshToken) return { kind: "unchanged" };

  const accessToken = request.cookies.get("access_token")?.value;
  if (accessToken && !isJwtExpired(accessToken)) return { kind: "unchanged" };

  const result = await refreshAccessToken(refreshToken);
  switch (result.kind) {
    case "ok":
      return { kind: "refreshed", accessToken: result.accessToken, uuid: result.uuid };
    case "invalid":
      // refresh token이 폐기·만료됐거나 유저가 삭제됨 — 남은 세션 쿠키 때문에
      // 로그인 화면에서 /board로 튕기며 갇히지 않도록 전부 정리한다
      return { kind: "cleared" };
    case "unavailable":
      // 일시 장애에 로그아웃시키지 않는다. 이후 API 호출이 실패를 그대로 드러낸다
      return { kind: "unchanged" };
  }
}

function applySessionUpdate(response: NextResponse, update: SessionUpdate) {
  if (update.kind === "refreshed") {
    writeRefreshedAccessToken(response.cookies, update.accessToken, update.uuid);
  } else if (update.kind === "cleared") {
    clearSessionCookies(response.cookies);
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { localePrefix, bare } = splitLocale(pathname);

  // 코드가 실린 콜백은 교환 핸들러로, 그 외(거절·실패)는 로그인 화면으로 보낸다
  if (bare === OAUTH_CALLBACK) {
    const code = request.nextUrl.searchParams.get("code");
    const url = request.nextUrl.clone();
    url.search = "";
    if (code) {
      url.pathname = "/api/auth/github/finish";
      url.searchParams.set("code", code);
    } else {
      url.pathname = `${localePrefix}/login`;
      url.searchParams.set("error", "github");
    }
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  }

  const update = await ensureFreshAccessToken(request);
  const hasSession =
    update.kind !== "cleared" && !!request.cookies.get("session")?.value;

  // 비로그인인데, 보호페이지 접근
  if (matches(bare, PROTECTED) && !hasSession) {
    // 로그인 후 원래 페이지(쿼리 포함)로 돌아오게 callbackUrl 추가
    const url = request.nextUrl.clone();
    url.pathname = `${localePrefix}/login`;
    url.search = "";
    url.searchParams.set("callbackUrl", pathname + search);
    return applySessionUpdate(NextResponse.redirect(url), update);
  }

  // 로그인 후, 로그인/회원가입 접근 -> /board로 리턴
  if (matches(bare, AUTH_ONLY) && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = `${localePrefix}/board`;
    url.search = "";
    return applySessionUpdate(NextResponse.redirect(url), update);
  }

  return applySessionUpdate(handleI18nRouting(request), update);
}

export const config = {
  // 프록시가 실행될 경로 (API, 확장자 있는 정적 파일 전부 제외 - public/icons 등)
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
