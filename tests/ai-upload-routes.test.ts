import { after, before, beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { makeJwt, startMockBackend, type MockBackend, type TestUser } from "./helpers/mockBackend";
import { blobCalls, resetBlobCalls } from "./mocks/vercel-blob.mjs";
import { openaiCalls, resetOpenaiCalls } from "./mocks/openai.mjs";
import { setCookieContext } from "./mocks/next-headers.mjs";

// P1-1 (uuid 쿠키만으로 인증 통과), P2-18 (입력 검증·업로드 한도), P2-19 (Blob 파일명 충돌)
// OpenAI·Blob은 tests/mocks 대역으로 바뀌어 실제 비용·업로드가 발생하지 않는다.

let backend: MockBackend;
let summarize: (req: NextRequest) => Promise<Response>;
let thumbnail: (req: NextRequest) => Promise<Response>;
let upload: (req: NextRequest) => Promise<Response>;

before(async () => {
  backend = await startMockBackend();
  process.env.NEXT_PUBLIC_API_URL = backend.url;
  process.env.OPENAI_API_KEY = "test-key";
  process.env.BLOB_READ_WRITE_TOKEN = "test-token";
  delete process.env.THUMBNAIL_PROVIDER;
  summarize = (await import("@/app/api/ai/summarize/route")).POST;
  thumbnail = (await import("@/app/api/ai/thumbnail/route")).POST;
  upload = (await import("@/app/api/upload/thumbnail/route")).POST;
});

after(async () => {
  await backend.close();
});

beforeEach(() => {
  backend.reset();
  resetBlobCalls();
  resetOpenaiCalls();
});

function cookieHeader(cookies: Record<string, string>) {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

// Route Handler 안에서 next/headers cookies()가 보는 값도 요청 쿠키와 같게 맞춘다 (실제 Next와 동일).
// 그래야 cookies()로 uuid를 읽던 예전 구현이었다면 이 테스트들이 실패한다.
function withRequestCookies(cookies: Record<string, string>) {
  setCookieContext({ mode: "action", cookies });
}

function jsonRequest(path: string, body: unknown, cookies: Record<string, string> = {}) {
  withRequestCookies(cookies);
  return new NextRequest(`http://localhost:3000${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: cookieHeader(cookies) },
    body: JSON.stringify(body),
  });
}

function uploadRequest(
  file: Blob | string,
  cookies: Record<string, string> = {},
  headers: Record<string, string> = {},
) {
  const form = new FormData();
  form.append("file", file);
  withRequestCookies(cookies);
  return new NextRequest("http://localhost:3000/api/upload/thumbnail", {
    method: "POST",
    headers: { cookie: cookieHeader(cookies), ...headers },
    body: form,
  });
}

const pngFile = (size = 16) =>
  new File([new Uint8Array(size)], "../../evil.php.png", { type: "image/png" });

const validSummary = { projectName: "PoFol", readmeText: "readme", techStack: ["React"] };
const validThumbnail = { projectName: "PoFol", techStack: ["React", "Spring Boot"] };

function signedIn(user: TestUser = backend.createUser()) {
  return { user, cookies: { uuid: user.uuid, access_token: backend.issueAccess(user) } };
}

/** 세 라우트를 같은 쿠키로 한 번씩 호출 */
async function callAll(cookies: Record<string, string>) {
  return Promise.all([
    summarize(jsonRequest("/api/ai/summarize", validSummary, cookies)),
    thumbnail(jsonRequest("/api/ai/thumbnail", validThumbnail, cookies)),
    upload(uploadRequest(pngFile(), cookies)),
  ]);
}

function assertNoExternalCalls() {
  assert.equal(openaiCalls(), 0, "OpenAI 호출이 없어야 한다");
  assert.equal(blobCalls().length, 0, "Blob 업로드가 없어야 한다");
}

describe("AI·업로드 라우트 인증 (P1-1)", () => {
  it("쿠키가 없으면 세 API 모두 401이고 외부 호출이 없다", async () => {
    const responses = await callAll({});
    assert.deepEqual(responses.map((r) => r.status), [401, 401, 401]);
    assertNoExternalCalls();
  });

  it("서명되지 않은 uuid 쿠키만 있으면 401 — 백엔드 확인 없이 거절된다", async () => {
    const responses = await callAll({ uuid: randomUUID() });
    assert.deepEqual(responses.map((r) => r.status), [401, 401, 401]);
    assertNoExternalCalls();
    assert.equal(backend.requests.length, 0);
  });

  it("위조된 access token은 백엔드가 거절해 401, 외부 호출이 없다", async () => {
    const victim = backend.createUser();
    const forged = makeJwt({
      sub: victim.email,
      uuid: victim.uuid,
      userId: victim.userId,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const responses = await callAll({ uuid: victim.uuid, access_token: forged });
    assert.deepEqual(responses.map((r) => r.status), [401, 401, 401]);
    assertNoExternalCalls();
  });

  it("만료된 access token만 있으면 백엔드에 묻지도 않고 401", async () => {
    const user = backend.createUser();
    const expired = backend.issueAccess(user, -60);
    const responses = await callAll({ uuid: user.uuid, access_token: expired });
    assert.deepEqual(responses.map((r) => r.status), [401, 401, 401]);
    assertNoExternalCalls();
    assert.equal(backend.requests.length, 0);
  });

  it("삭제된 사용자의 아직 유효한 토큰도 401", async () => {
    const { cookies } = signedIn(backend.createUser({ deleted: true }));
    const responses = await callAll(cookies);
    assert.deepEqual(responses.map((r) => r.status), [401, 401, 401]);
    assertNoExternalCalls();
  });

  it("유효한 토큰이면 백엔드가 확인한 뒤 외부 호출까지 간다", async () => {
    const responses = await callAll(signedIn().cookies);
    assert.deepEqual(responses.map((r) => r.status), [200, 200, 200]);
    assert.equal(openaiCalls(), 1);
    assert.equal(blobCalls().length, 2);
    assert.equal(backend.countRequests("GET", "/api/auth/school/status"), 3);
  });

  it("access token이 만료됐어도 유효한 refresh token이면 갱신해서 처리하고 새 쿠키를 내려준다", async () => {
    const user = backend.createUser();
    const res = await summarize(
      jsonRequest("/api/ai/summarize", validSummary, {
        access_token: backend.issueAccess(user, -60),
        refresh_token: backend.issueRefresh(user),
      }),
    );
    assert.equal(res.status, 200);
    assert.equal(backend.countRequests("POST", "/api/auth/refresh"), 1);
    const setCookie = res.headers.getSetCookie().join("\n");
    assert.match(setCookie, /access_token=/);
    assert.match(setCookie, new RegExp(`uuid=${user.uuid}`));
  });

  it("uuid 쿠키를 바꿔가며 호출해도 같은 인증 사용자로 제한된다 (5회 후 429)", async () => {
    const { user, cookies } = signedIn();
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await summarize(
        jsonRequest("/api/ai/summarize", validSummary, { ...cookies, uuid: randomUUID() }),
      );
      statuses.push(res.status);
    }
    assert.deepEqual(statuses, [200, 200, 200, 200, 200, 429]);
    assert.equal(openaiCalls(), 5);

    // 다른 사용자는 영향을 받지 않는다
    const other = await summarize(jsonRequest("/api/ai/summarize", validSummary, signedIn().cookies));
    assert.equal(other.status, 200);
    void user;
  });

  it("인증 서버 장애면 503이고 외부 호출이 없다", async () => {
    const { cookies } = signedIn();
    backend.setDown(true);
    try {
      const responses = await callAll(cookies);
      assert.deepEqual(responses.map((r) => r.status), [503, 503, 503]);
      assertNoExternalCalls();
    } finally {
      backend.setDown(false);
    }
  });
});

describe("AI 입력 검증 (P2-18)", () => {
  const invalidThumbnailBodies: [string, unknown][] = [
    ["projectName 누락", { techStack: ["React"] }],
    ["빈 projectName", { projectName: "   " }],
    ["숫자 projectName", { projectName: 42 }],
    ["techStack: [null]", { projectName: "P", techStack: [null] }],
    ["techStack이 배열이 아님", { projectName: "P", techStack: "React" }],
    ["기술명이 너무 김", { projectName: "P", techStack: ["x".repeat(51)] }],
    ["기술 개수 초과", { projectName: "P", techStack: Array.from({ length: 51 }, (_, i) => `t${i}`) }],
    ["설명이 문자열이 아님", { projectName: "P", projectDescription: { a: 1 } }],
    ["설명이 너무 김", { projectName: "P", projectDescription: "x".repeat(2001) }],
    ["projectName이 너무 김", { projectName: "x".repeat(201) }],
    ["본문이 배열", ["P"]],
  ];

  for (const [name, body] of invalidThumbnailBodies) {
    it(`썸네일: ${name} → provider·Blob 호출 없이 400`, async () => {
      const res = await thumbnail(jsonRequest("/api/ai/thumbnail", body, signedIn().cookies));
      assert.equal(res.status, 400);
      assertNoExternalCalls();
    });
  }

  it("썸네일: openai provider도 검증 실패면 호출되지 않는다", async () => {
    process.env.THUMBNAIL_PROVIDER = "openai";
    try {
      const res = await thumbnail(
        jsonRequest("/api/ai/thumbnail", { projectName: "P", techStack: [null] }, signedIn().cookies),
      );
      assert.equal(res.status, 400);
      assertNoExternalCalls();
    } finally {
      delete process.env.THUMBNAIL_PROVIDER;
    }
  });

  it("요약: 기술명 하나가 50자를 넘으면 OpenAI 호출 없이 400", async () => {
    const res = await summarize(
      jsonRequest(
        "/api/ai/summarize",
        { projectName: "P", techStack: ["React", "y".repeat(51)] },
        signedIn().cookies,
      ),
    );
    assert.equal(res.status, 400);
    assertNoExternalCalls();
  });

  it("요약: techStack 항목이 문자열이 아니면 400", async () => {
    const res = await summarize(
      jsonRequest("/api/ai/summarize", { projectName: "P", techStack: [1] }, signedIn().cookies),
    );
    assert.equal(res.status, 400);
    assertNoExternalCalls();
  });
});

describe("썸네일 업로드 한도·형식 (P2-18)", () => {
  it("선언된 본문 크기가 한도를 넘으면 본문을 읽지 않고 413", async () => {
    const res = await upload(
      uploadRequest(pngFile(), signedIn().cookies, { "content-length": String(5 * 1024 * 1024) }),
    );
    assert.equal(res.status, 413);
    assertNoExternalCalls();
  });

  it("4 MiB를 넘는 파일은 413", async () => {
    const res = await upload(uploadRequest(pngFile(4 * 1024 * 1024 + 1), signedIn().cookies));
    assert.equal(res.status, 413);
    assertNoExternalCalls();
  });

  it("허용하지 않는 형식은 400", async () => {
    const svg = new File(["<svg/>"], "a.svg", { type: "image/svg+xml" });
    const res = await upload(uploadRequest(svg, signedIn().cookies));
    assert.equal(res.status, 400);
    assertNoExternalCalls();
  });

  it("file 필드가 파일이 아니면 400", async () => {
    const res = await upload(uploadRequest("not-a-file", signedIn().cookies));
    assert.equal(res.status, 400);
    assertNoExternalCalls();
  });

  it("4 MiB 이하 PNG는 업로드되고, 파일명 대신 MIME으로 확장자를 정한다", async () => {
    const res = await upload(uploadRequest(pngFile(4 * 1024 * 1024), signedIn().cookies));
    assert.equal(res.status, 200);
    assert.equal(blobCalls().length, 1);
    assert.match(blobCalls()[0].pathname, /^thumbnails\/[0-9a-f-]{36}\.png$/);
  });
});

describe("Blob 파일명 충돌 (P2-19)", () => {
  it("같은 밀리초에 들어온 동시 요청도 서로 다른 객체로 저장된다", async () => {
    mock.method(Date, "now", () => 1_700_000_000_000);
    try {
      const { cookies } = signedIn();
      const responses = await Promise.all([
        upload(uploadRequest(pngFile(), cookies)),
        upload(uploadRequest(pngFile(), cookies)),
        thumbnail(jsonRequest("/api/ai/thumbnail", validThumbnail, cookies)),
        thumbnail(jsonRequest("/api/ai/thumbnail", validThumbnail, cookies)),
      ]);
      assert.deepEqual(responses.map((r) => r.status), [200, 200, 200, 200]);
      const paths = blobCalls().map((c: { pathname: string }) => c.pathname);
      assert.equal(new Set(paths).size, 4, `경로가 겹쳤다: ${paths.join(", ")}`);
    } finally {
      mock.restoreAll();
    }
  });
});
