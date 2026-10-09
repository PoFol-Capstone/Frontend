import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { NextRequest, type NextResponse } from "next/server";
import { makeJwt, startMockBackend, type MockBackend } from "./helpers/mockBackend";
import { cookieWrites, setCookieContext } from "./mocks/next-headers.mjs";

// P1-3 (OAuth 콜백 URL로 계정 바꿔치기), P1-4 (서버 렌더 중 토큰 갱신·세션 삭제 실패)

let backend: MockBackend;
let proxy: (req: NextRequest) => Promise<NextResponse>;
let httpModule: typeof import("@/lib/http.server");

before(async () => {
  backend = await startMockBackend();
  process.env.NEXT_PUBLIC_API_URL = backend.url;
  proxy = (await import("@/proxy")).proxy;
  httpModule = await import("@/lib/http.server");

  // 인증 필수 API (BE의 anyRequest().authenticated()처럼 무효 토큰이면 403)
  backend.route("GET /api/recruitment/posts", (_req, user) =>
    user ? { status: 200, body: [] } : { status: 403 },
  );
  // 공개 API (토큰 없으면 익명 200 — 개인화 필드가 false)
  backend.route("GET /api/posts", (_req, user) => ({
    status: 200,
    body: { content: [{ uuid: "p1", isLiked: !!user }], number: 0, totalPages: 1, last: true },
  }));
});

after(async () => {
  await backend.close();
});

beforeEach(() => {
  backend.reset();
});

function pageRequest(path: string, cookies: Record<string, string> = {}) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: {
      cookie: Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join("; "),
    },
  });
}

const SESSION_COOKIES = ["session", "uuid", "access_token", "refresh_token", "school"];

/** 세션 관련 Set-Cookie만 (next-intl이 붙이는 NEXT_LOCALE 등은 제외) */
function setCookies(res: Response) {
  return res.headers
    .getSetCookie()
    .filter((c) => SESSION_COOKIES.includes(c.slice(0, c.indexOf("="))));
}

function mergedSessionCookieNames(res: Response) {
  const header = res.headers.get("x-middleware-set-cookie") ?? "";
  return SESSION_COOKIES.filter((name) => new RegExp(`(?:^|,\\s*)${name}=`).test(header));
}

/** Next가 같은 요청의 cookies()에 병합하는 proxy 쿠키 (x-middleware-set-cookie) */
function mergedCookie(res: Response, name: string) {
  const header = res.headers.get("x-middleware-set-cookie") ?? "";
  const match = header.match(new RegExp(`(?:^|,\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function existingSession() {
  const user = backend.createUser();
  return {
    user,
    cookies: {
      session: user.email,
      uuid: user.uuid,
      access_token: backend.issueAccess(user),
      refresh_token: backend.issueRefresh(user),
    },
  };
}

describe("OAuth 콜백 URL (P1-3)", () => {
  const attacker = {
    accessToken: makeJwt({ uuid: randomUUID(), exp: Math.floor(Date.now() / 1000) + 3600 }),
    refreshToken: "attacker-refresh",
    uuid: randomUUID(),
    name: "attacker",
  };

  const variants: [string, string][] = [
    ["state 없음", `?${new URLSearchParams(attacker)}`],
    ["state 불일치", `?${new URLSearchParams({ ...attacker, state: "forged" })}`],
    ["재사용된 state", `?${new URLSearchParams({ ...attacker, state: "already-used" })}`],
    ["다른 브라우저에서 시작한 콜백", `?${new URLSearchParams({ ...attacker, state: randomUUID() })}`],
  ];

  for (const [name, query] of variants) {
    for (const prefix of ["", "/en"]) {
      it(`${name}${prefix ? " (en)" : ""}: 기존 로그인 쿠키를 바꾸지 않고 토큰 없는 주소로 보낸다`, async () => {
        const { cookies } = existingSession();
        const res = await proxy(pageRequest(`${prefix}/oauth/callback${query}`, cookies));

        assert.equal(res.status, 307);
        const location = new URL(res.headers.get("location")!);
        assert.equal(location.pathname, `${prefix}/oauth/callback`);
        assert.equal(location.search, "");
        assert.deepEqual(setCookies(res), []);
        assert.deepEqual(mergedSessionCookieNames(res), []);
        assert.equal(res.headers.get("Cache-Control"), "no-store");
        assert.equal(backend.requests.length, 0);
      });
    }
  }

  it("쿼리 없는 콜백 페이지는 쿠키를 건드리지 않는 안내 화면으로 그대로 간다", async () => {
    const { cookies } = existingSession();
    const res = await proxy(pageRequest("/oauth/callback", cookies));
    assert.notEqual(res.status, 307);
    assert.deepEqual(setCookies(res), []);
  });

  it("URL 토큰을 세션으로 저장하던 Server Action이 더 이상 없다", async () => {
    const session = await import("@/lib/session");
    const auth = await import("@/lib/auth");
    assert.equal("saveAccessToken" in session, false);
    assert.equal("saveLogin" in session, false);
    // 토큰을 브라우저로 돌려주던 로그인/회원가입 액션도 없다
    assert.equal("login" in auth, false);
    assert.equal("register" in auth, false);
  });
});

describe("proxy에서 토큰 갱신 (P1-4)", () => {
  it("만료된 access + 유효한 refresh로 /settings 직접 접근 → 렌더 전에 갱신해 같은 요청에 반영", async () => {
    const { user, cookies } = existingSession();
    const res = await proxy(
      pageRequest("/settings", { ...cookies, access_token: backend.issueAccess(user, -60) }),
    );

    assert.notEqual(res.status, 307, "로그인으로 보내면 안 된다");
    assert.equal(backend.countRequests("POST", "/api/auth/refresh"), 1);
    const refreshed = mergedCookie(res, "access_token");
    assert.ok(refreshed, "RSC cookies()에 병합될 새 access_token이 있어야 한다");
    assert.equal(mergedCookie(res, "uuid"), user.uuid);
    assert.ok(setCookies(res).some((c) => c.startsWith(`access_token=${refreshed}`)));
  });

  it("access 쿠키가 아예 없어도(공개 페이지) 갱신해서 개인화 상태가 유지된다", async () => {
    const { cookies } = existingSession();
    const { access_token: _ignored, ...withoutAccess } = cookies;
    void _ignored;
    const res = await proxy(pageRequest("/search?q=react", withoutAccess));
    assert.equal(backend.countRequests("POST", "/api/auth/refresh"), 1);
    assert.ok(mergedCookie(res, "access_token"));
  });

  it("access가 유효하면 백엔드를 부르지 않는다", async () => {
    const { cookies } = existingSession();
    const res = await proxy(pageRequest("/settings", cookies));
    assert.equal(backend.requests.length, 0);
    assert.deepEqual(setCookies(res), []);
    assert.deepEqual(mergedSessionCookieNames(res), []);
  });

  it("refresh가 거절되면(삭제된 사용자 등) 세션 쿠키를 모두 지우고 로그인으로 보낸다", async () => {
    const { user, cookies } = existingSession();
    user.deleted = true;
    const res = await proxy(
      pageRequest("/profile?page=2", { ...cookies, access_token: backend.issueAccess(user, -60) }),
    );

    assert.equal(res.status, 307);
    const location = new URL(res.headers.get("location")!);
    assert.equal(location.pathname, "/login");
    assert.equal(location.searchParams.get("callbackUrl"), "/profile?page=2");
    for (const name of ["session", "uuid", "access_token", "refresh_token", "school"]) {
      assert.ok(
        setCookies(res).some((c) => c.startsWith(`${name}=;`) && /Expires=Thu, 01 Jan 1970/i.test(c)),
        `${name} 쿠키가 지워져야 한다`,
      );
    }
  });

  it("세션이 정리된 뒤에는 로그인 화면에 갇히지 않는다 (/login이 /board로 튕기지 않음)", async () => {
    const { user, cookies } = existingSession();
    user.deleted = true;
    const res = await proxy(
      pageRequest("/login", { ...cookies, access_token: backend.issueAccess(user, -60) }),
    );
    assert.notEqual(new URL(res.headers.get("location") ?? "http://x/").pathname, "/board");
  });

  it("인증 서버 장애면 로그아웃시키지 않고 그대로 진행한다", async () => {
    const { user, cookies } = existingSession();
    backend.setDown(true);
    try {
      const res = await proxy(
        pageRequest("/settings", { ...cookies, access_token: backend.issueAccess(user, -60) }),
      );
      assert.notEqual(res.status, 307);
      assert.deepEqual(setCookies(res), []);
    } finally {
      backend.setDown(false);
    }
  });
});

describe("Server Component 렌더 중 http 요청 (P1-4)", () => {
  it("access가 없고 refresh만 있으면 렌더 중에도 갱신한 토큰으로 조회하고, 쿠키는 쓰지 않는다", async () => {
    const { user } = existingSession();
    setCookieContext({ mode: "render", cookies: { refresh_token: backend.issueRefresh(user) } });

    const res = await httpModule.http.get("/api/posts");
    assert.equal(res.data.content[0].isLiked, true, "익명 응답이 아니라 개인화된 응답이어야 한다");
    assert.deepEqual(cookieWrites(), [], "렌더 중에는 쿠키를 쓰지 않는다");
  });

  it("거절된(폐기·위조) access는 렌더 중에도 refresh 후 재시도해 성공한다", async () => {
    const { user } = existingSession();
    const revoked = makeJwt({
      uuid: user.uuid,
      userId: user.userId,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    setCookieContext({
      mode: "render",
      cookies: { access_token: revoked, refresh_token: backend.issueRefresh(user) },
    });

    const res = await httpModule.http.get("/api/recruitment/posts");
    assert.equal(res.status, 200);
    assert.equal(backend.countRequests("POST", "/api/auth/refresh"), 1);
    assert.deepEqual(cookieWrites(), []);
  });

  it("refresh도 거절되면 갱신 실패를 삼키지 않고 원래 403을 돌려준다", async () => {
    const user = backend.createUser();
    setCookieContext({
      mode: "render",
      cookies: {
        access_token: makeJwt({ uuid: user.uuid, exp: Math.floor(Date.now() / 1000) + 3600 }),
        refresh_token: "revoked-refresh",
      },
    });

    await assert.rejects(httpModule.http.get("/api/recruitment/posts"), (error: unknown) => {
      assert.ok(error instanceof httpModule.ApiError);
      assert.equal(error.status, 403);
      assert.equal(httpModule.isSessionRejected(error), true);
      return true;
    });
  });

  it("개인화 API(requireAuth)는 토큰을 못 구하면 보내지 않고 401", async () => {
    setCookieContext({ mode: "render", cookies: {} });
    await assert.rejects(
      httpModule.http.get("/api/posts", { requireAuth: true }),
      (error: unknown) => error instanceof httpModule.ApiError && error.status === 401,
    );
    assert.equal(backend.requests.length, 0);
  });

  it("개인화 API(requireAuth)에서 인증 서버 장애는 401이 아니라 503", async () => {
    const user = backend.createUser();
    setCookieContext({ mode: "render", cookies: { refresh_token: backend.issueRefresh(user) } });
    backend.setDown(true);
    try {
      await assert.rejects(
        httpModule.http.get("/api/posts", { requireAuth: true }),
        (error: unknown) => error instanceof httpModule.ApiError && error.status === 503,
      );
    } finally {
      backend.setDown(false);
    }
  });
});

describe("세션 정리 Server Function", () => {
  it("clearSession은 세션·uuid·토큰·학교 쿠키를 모두 지운다", async () => {
    const { cookies } = existingSession();
    setCookieContext({ mode: "action", cookies: { ...cookies, school: "x" } });
    const { clearSession } = await import("@/lib/session");
    await clearSession();
    assert.deepEqual(
      cookieWrites()
        .filter((w: { op: string }) => w.op === "delete")
        .map((w: { name: string }) => w.name)
        .sort(),
      ["access_token", "refresh_token", "school", "session", "uuid"],
    );
  });
});
