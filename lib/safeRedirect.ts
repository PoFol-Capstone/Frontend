import { routing } from "@/i18n/routing";

// C0 제어문자·DEL·역슬래시. 브라우저는 URL을 해석할 때 탭/개행을 지우고 `\`를 `/`로 바꾸므로
// "/\evil.com", "/\t/evil.com" 같은 값이 "//evil.com"(다른 사이트)로 바뀔 수 있다.
const UNSAFE_CHARS = /[\u0000-\u001F\u007F\\]/;

const MAX_LENGTH = 2048;

/**
 * 로그인 후 이동할 callbackUrl을 같은 origin의 내부 경로로만 허용한다.
 *
 * 쿼리에서 받은 값을 그대로 `window.location`에 넣으면 외부 사이트 이동(open redirect)이나
 * `javascript:` URL 실행이 가능하다. "/"로 시작하는 상대 경로만 받고, 실제로 해석한 결과가
 * 같은 origin의 http(s) URL인지 다시 확인한다. 통과하면 path + query + hash를 그대로 돌려준다.
 *
 * @returns 안전한 내부 경로, 아니면 null
 */
export function toSafeInternalPath(raw: unknown, origin: string): string | null {
  if (typeof raw !== "string" || !raw || raw.length > MAX_LENGTH) return null;
  // 프로토콜 상대 URL("//evil.com")과 절대 URL·javascript: 등은 여기서 걸러진다
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  if (UNSAFE_CHARS.test(raw)) return null;

  let base: URL;
  let url: URL;
  try {
    base = new URL(origin);
    url = new URL(raw, base);
  } catch {
    return null;
  }

  if (url.origin !== base.origin) return null;
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  return url.pathname + url.search + url.hash;
}

/** 현재 언어의 기본 게시판 경로 (localePrefix: "as-needed" — 기본 언어는 접두사 없음) */
export function defaultBoardPath(locale: string): string {
  return locale === routing.defaultLocale ? "/board" : `/${locale}/board`;
}

/** 로그인 직후 실제로 이동할 주소. 잘못된 callbackUrl은 현재 언어의 게시판으로 바꾼다. */
export function resolvePostLoginPath(
  callbackUrl: unknown,
  origin: string,
  locale: string,
): string {
  return toSafeInternalPath(callbackUrl, origin) ?? defaultBoardPath(locale);
}
