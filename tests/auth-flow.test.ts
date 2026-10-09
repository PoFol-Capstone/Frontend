import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { startMockBackend, type MockBackend } from "./helpers/mockBackend";
import { cookieWrites, setCookieContext } from "./mocks/next-headers.mjs";
import { resolvePostLoginPath, toSafeInternalPath } from "@/lib/safeRedirect";
import {
  beginLoginFlow,
  beginSignupFlow,
  finishAuthFlow,
  handOffToSignup,
  readPendingAuth,
  saveSignupName,
} from "@/lib/authFlow";

// P1-2 (로그인 callbackUrl 검증), P2-6 (이전 회원가입 이메일이 다음 로그인에 섞임)

const ORIGIN = "https://pofol.test";

describe("로그인 후 이동 주소 검증 (P1-2)", () => {
  const allowed: [string, string][] = [
    ["/board", "/board"],
    ["/en/settings", "/en/settings"],
    ["/search?q=react&category=School", "/search?q=react&category=School"],
    ["/board/abc#comments", "/board/abc#comments"],
    ["/profile?page=2#top", "/profile?page=2#top"],
    // 인코딩된 슬래시는 같은 origin 안의 경로 문자열일 뿐이다
    ["/%2F%2Fevil.test", "/%2F%2Fevil.test"],
  ];
  for (const [input, expected] of allowed) {
    it(`허용: ${input}`, () => {
      assert.equal(toSafeInternalPath(input, ORIGIN), expected);
    });
  }

  const blocked = [
    "javascript:alert(1)",
    "JAVASCRIPT:alert(document.cookie)",
    " javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "https://evil.test/board",
    "http://pofol.test.evil.test/",
    "//evil.test",
    "//evil.test/board",
    "///evil.test",
    "/\\evil.test",
    "\\\\evil.test",
    "/\\/evil.test",
    "/\t/evil.test",
    "/\n/evil.test",
    "/\r//evil.test",
    "/\u0000/evil.test",
    " /board",
    "board",
    "",
    "/" + "a".repeat(3000),
  ];
  for (const input of blocked) {
    it(`차단: ${JSON.stringify(input).slice(0, 40)}`, () => {
      assert.equal(toSafeInternalPath(input, ORIGIN), null);
    });
  }

  it("잘못된 값이면 현재 언어의 기본 게시판으로 보낸다", () => {
    assert.equal(resolvePostLoginPath("https://evil.test", ORIGIN, "ko"), "/board");
    assert.equal(resolvePostLoginPath("javascript:alert(1)", ORIGIN, "en"), "/en/board");
    assert.equal(resolvePostLoginPath(null, ORIGIN, "en"), "/en/board");
    assert.equal(resolvePostLoginPath("/en/profile?page=2#x", ORIGIN, "en"), "/en/profile?page=2#x");
  });
});

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  keys() {
    return [...this.map.keys()].sort();
  }
}

describe("인증 흐름 상태 (P2-6)", () => {
  it("A로 가입을 시작했다가 그만두고 B로 로그인하면 B 이메일로 인증한다", () => {
    const storage = new MemoryStorage();
    saveSignupName(storage, "에이");
    beginSignupFlow(storage, "a@test.dev");

    beginLoginFlow(storage, "b@test.dev", "/settings");

    assert.deepEqual(readPendingAuth(storage), { flow: "login", email: "b@test.dev", name: "" });
    // 중단된 가입에서 받은 이름이 로그인 흐름에 남지 않는다
    assert.equal(storage.getItem("signupName"), null);
  });

  it("B로 로그인을 시작했다가 그만두고 C로 가입하면 C 이메일과 C의 이름으로 진행한다", () => {
    const storage = new MemoryStorage();
    beginLoginFlow(storage, "b@test.dev", null);
    saveSignupName(storage, "씨");
    beginSignupFlow(storage, "c@test.dev");
    assert.deepEqual(readPendingAuth(storage), { flow: "signup", email: "c@test.dev", name: "씨" });
  });

  it("이전 버전이 남긴 loginEmail/signupEmail은 무시하고 정리한다", () => {
    const storage = new MemoryStorage();
    storage.setItem("signupEmail", "old-a@test.dev");
    storage.setItem("loginEmail", "old-b@test.dev");
    assert.equal(readPendingAuth(storage), null);

    beginLoginFlow(storage, "new@test.dev", null);
    assert.equal(storage.getItem("signupEmail"), null);
    assert.equal(storage.getItem("loginEmail"), null);
    assert.equal(readPendingAuth(storage)?.email, "new@test.dev");
  });

  it("로그인하려던 이메일이 미가입이면 회원가입으로 넘기되 callbackUrl은 남긴다", () => {
    const storage = new MemoryStorage();
    beginLoginFlow(storage, "new@test.dev", "/en/settings");
    handOffToSignup(storage);
    assert.equal(readPendingAuth(storage), null);
    assert.equal(storage.getItem("callbackUrl"), "/en/settings");
  });

  it("기존 계정으로 가입 화면을 거쳐 로그인해도 성공 후 흐름 상태가 모두 지워진다", () => {
    const storage = new MemoryStorage();
    beginLoginFlow(storage, "x@test.dev", "/board?category=Bookmarks");
    saveSignupName(storage, "기존회원");
    beginSignupFlow(storage, "existing@test.dev");

    assert.equal(finishAuthFlow(storage), "/board?category=Bookmarks");
    assert.deepEqual(storage.keys(), []);
  });
});

describe("이메일 OTP 로그인 Server Function", () => {
  let backend: MockBackend;
  let signInWithEmailOtp: typeof import("@/lib/auth").signInWithEmailOtp;
  const registered = new Map<string, { uuid: string }>();

  before(async () => {
    backend = await startMockBackend();
    process.env.NEXT_PUBLIC_API_URL = backend.url;
    signInWithEmailOtp = (await import("@/lib/auth")).signInWithEmailOtp;

    backend.route("POST /api/auth/email/verify", (req) => {
      const { email, code } = req.body as { email: string; code: string };
      if (code !== "123456") return { status: 400, body: { error: "인증 코드가 일치하지 않습니다" } };
      return { status: 200, body: { verified: true, newUser: !registered.has(email) } };
    });
    const issue = (email: string) => {
      const existing = registered.get(email);
      const user = backend.createUser(existing ? { email, uuid: existing.uuid } : { email });
      registered.set(email, { uuid: user.uuid });
      return {
        status: 200,
        body: {
          accessToken: backend.issueAccess(user),
          refreshToken: backend.issueRefresh(user),
          uuid: user.uuid,
          name: "이름",
        },
      };
    };
    backend.route("POST /api/auth/login", (req) => issue((req.body as { email: string }).email));
    backend.route("POST /api/auth/register", (req) => issue((req.body as { email: string }).email));
  });

  after(async () => {
    await backend.close();
  });

  beforeEach(() => {
    setCookieContext({ mode: "action", cookies: {} });
  });

  const written = () =>
    Object.fromEntries(
      cookieWrites()
        .filter((w: { op: string }) => w.op === "set")
        .map((w: { name: string; value: string }) => [w.name, w.value]),
    );

  it("가입된 이메일: 백엔드가 준 토큰·uuid로만 세션을 만들고 토큰은 돌려주지 않는다", async () => {
    registered.set("member@test.dev", { uuid: "11111111-1111-4111-8111-111111111111" });
    const result = await signInWithEmailOtp("member@test.dev", "123456");

    assert.deepEqual(result, { status: "signedIn" });
    const cookies = written();
    assert.equal(cookies.session, "member@test.dev");
    assert.equal(cookies.uuid, "11111111-1111-4111-8111-111111111111");
    assert.ok(cookies.access_token && cookies.refresh_token);
  });

  it("미가입 이메일을 로그인 흐름(이름 없음)으로 인증하면 회원가입으로 보내고 세션을 만들지 않는다", async () => {
    const result = await signInWithEmailOtp("brand-new@test.dev", "123456");
    assert.deepEqual(result, { status: "needSignup" });
    assert.deepEqual(written(), {});
  });

  it("미가입 이메일 + 이름이면 회원가입 후 세션을 만든다", async () => {
    const result = await signInWithEmailOtp("signup@test.dev", "123456", "새회원");
    assert.deepEqual(result, { status: "signedIn" });
    assert.equal(written().session, "signup@test.dev");
    assert.equal(written().uuid, registered.get("signup@test.dev")?.uuid);
  });

  it("틀린 코드면 invalidCode이고 세션을 만들지 않는다", async () => {
    const result = await signInWithEmailOtp("member@test.dev", "000000");
    assert.deepEqual(result, { status: "invalidCode" });
    assert.deepEqual(written(), {});
  });
});
