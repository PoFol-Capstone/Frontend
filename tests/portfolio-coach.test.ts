import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { startMockBackend, type MockBackend, type TestUser } from "./helpers/mockBackend";
import { openaiCalls, resetOpenaiCalls } from "./mocks/openai.mjs";
import { setCookieContext } from "./mocks/next-headers.mjs";
import { isSlidesEmbedUrl, toSlidesEmbedUrl } from "@/lib/slides";
import {
  assembleReadme,
  checkTotals,
  editSentence,
  groupLanguages,
  OTHER_LANGUAGE,
  parseDirection,
  verifiedFacts,
} from "@/lib/coachContent";
import { parseProfileReadmeInput, parseResumeInput } from "@/lib/aiInput";
import type { AnalyzedRepo, GitHubAnalysis } from "@/types/githubAnalysis";

// 포트폴리오 코치 (pofol/docs/plan-2026-10-25-portfolio-coach.md) — 순수 함수와 AI·레포 라우트 계약

const repo = (overrides: Partial<AnalyzedRepo> = {}): AnalyzedRepo => ({
  fullName: "me/app",
  name: "app",
  description: "앱",
  topics: [],
  homepage: null,
  language: "Java",
  stars: 0,
  createdAt: "2026-01-01T00:00:00Z",
  pushedAt: "2026-03-01T00:00:00Z",
  commitCount: 40,
  contributorCount: 3,
  readmeLength: 900,
  readmeExcerpt: "# app",
  checks: [],
  partial: false,
  ...overrides,
});

const analysis = (overrides: Partial<GitHubAnalysis> = {}): GitHubAnalysis => ({
  status: "DONE",
  failureReason: null,
  analyzedAt: "2026-10-25T00:00:00Z",
  login: "me",
  summary: {
    repoCount: { owned: 1, forked: 0 },
    totalStars: 0,
    languages: [{ name: "Java", bytes: 10, ratio: 1 }],
    activeRepos90d: 1,
    lastPushedAt: null,
    hasProfileReadme: false,
  },
  accountChecks: [],
  repos: [repo()],
  topRepos: [{ fullName: "me/app", reasons: ["ACTIVE_HISTORY"] }],
  featuredRepos: [],
  direction: null,
  profileReadmeDraft: null,
  visibility: { summary: false, languages: false, topRepos: false, direction: false },
  ...overrides,
});

describe("구글 슬라이드 링크 변환 (3.5)", () => {
  it("공유·편집 링크를 embed URL로 바꾼다", () => {
    for (const input of [
      "https://docs.google.com/presentation/d/abc_D-1/edit?usp=sharing",
      "https://docs.google.com/presentation/d/abc_D-1/",
      "https://docs.google.com/presentation/d/abc_D-1",
      "  https://docs.google.com/presentation/d/abc_D-1/edit#slide=id.p  ",
    ]) {
      assert.equal(toSlidesEmbedUrl(input), "https://docs.google.com/presentation/d/abc_D-1/embed");
    }
  });

  it("다른 호스트·형식은 거절한다 (임의 URL iframe 방지)", () => {
    for (const input of [
      "http://docs.google.com/presentation/d/abc/edit",
      "https://docs.google.com.evil.com/presentation/d/abc/edit",
      "https://docs.google.com/document/d/abc/edit",
      "https://docs.google.com/presentation/d/e/2PACX-1/pub",
      "javascript:alert(1)",
      "not a url",
    ]) {
      assert.equal(toSlidesEmbedUrl(input), null, input);
    }
    assert.equal(isSlidesEmbedUrl("https://docs.google.com/presentation/d/abc/embed"), true);
    assert.equal(isSlidesEmbedUrl("https://docs.google.com/presentation/d/abc/embed?x=<script>"), false);
  });
});

describe("대시보드·체크리스트 계산 (3.1·3.2)", () => {
  it("언어는 상위 5개 + 기타로 묶는다", () => {
    const languages = ["A", "B", "C", "D", "E", "F", "G"].map((name, i) => ({ name, bytes: 1, ratio: [0.5, 0.2, 0.1, 0.1, 0.05, 0.03, 0.02][i] }));
    const grouped = groupLanguages(languages);
    assert.deepEqual(grouped.map((l) => l.name), ["A", "B", "C", "D", "E", OTHER_LANGUAGE]);
    assert.equal(grouped[5].ratio, 0.05);
    assert.equal(groupLanguages(languages.slice(0, 2)).length, 2);
  });

  it("무시한 점검은 요약 칩에서 빠진다", () => {
    const totals = checkTotals([
      repo({ checks: [{ code: "NO_README", ignored: false }, { code: "NO_TESTS", ignored: true }] }),
      repo({ fullName: "me/b", checks: [{ code: "NO_README", ignored: false }] }),
    ]);
    assert.equal(totals.get("NO_README"), 2);
    assert.equal(totals.has("NO_TESTS"), false);
  });
});

describe("AI 결과 해석·조립 (3.3·3.4·3.7)", () => {
  it("저장된 방향성 JSON을 읽고, 손상된 값은 요약 문장으로 본다", () => {
    const parsed = parseDirection(JSON.stringify({ summary: "백엔드", evidence: ["Java", 3], fits: [], gaps: ["테스트"], targetRole: "백엔드" }));
    assert.deepEqual(parsed, { summary: "백엔드", evidence: ["Java"], fits: [], gaps: ["테스트"], targetRole: "백엔드" });
    assert.equal(parseDirection("그냥 문장")?.summary, "그냥 문장");
    assert.equal(parseDirection(null), null);
  });

  it("README는 정해진 순서로 조립하고 장식은 고른 것만 코드로 만든다", () => {
    const md = assembleReadme(
      { intro: "# 안녕하세요", projects: "## 대표 프로젝트", contact: "## 연락처" },
      {
        login: "me",
        decorations: ["header", "badges", "stats"],
        skills: [{ name: "Spring Boot", iconSlug: "springboot", badgeColor: "#6DB33F" }],
      },
    );
    const order = ["capsule-render", "# 안녕하세요", "## 대표 프로젝트", "img.shields.io/badge/Spring%20Boot-6DB33F", "## 연락처", "github-readme-stats"]
      .map((part) => md.indexOf(part));
    assert.ok(order.every((idx) => idx >= 0), md);
    assert.deepEqual([...order].sort((a, b) => a - b), order);
    assert.equal(md.includes("streak-stats"), false);
    assert.equal(md.includes("solved.ac"), false);
  });

  it("검증 문장은 GitHub 수집값으로만 만들고, 고치면 본인 작성이 된다", () => {
    const facts = verifiedFacts(repo({ homepage: "https://x.dev" }));
    assert.deepEqual(facts.map((f) => f.source), ["VERIFIED", "VERIFIED", "VERIFIED", "VERIFIED"]);
    assert.ok(facts[0].text.includes("40"));
    assert.deepEqual(verifiedFacts(undefined), []);
    assert.deepEqual(verifiedFacts(repo({ commitCount: null, contributorCount: 1, createdAt: null })), []);

    const sentence = { text: "AI 문장", source: "AI" as const };
    assert.equal(editSentence(sentence, "AI 문장"), sentence);
    assert.deepEqual(editSentence(sentence, "고친 문장"), { text: "고친 문장", source: "SELF" });
  });
});

describe("코치 AI 입력 검증", () => {
  it("README 꾸미기 입력", () => {
    assert.equal(parseProfileReadmeInput({ decorations: ["badges", "unknown"] }).ok, false);
    assert.equal(parseProfileReadmeInput({ decorations: ["solvedac"], solvedacId: "a b" }).ok, false);
    assert.equal(parseProfileReadmeInput({ decorations: ["blog"], blogRss: "http://x" }).ok, false);
    const ok = parseProfileReadmeInput({ decorations: ["badges", "badges"], solvedacId: "me_1", targetRole: " 백엔드 " });
    assert.ok(ok.ok);
    assert.deepEqual(ok.value, { targetRole: "백엔드", decorations: ["badges"], solvedacId: "me_1", blogRss: null });
  });

  it("이력서 설문은 희망 직무가 필수이고 강점은 3개까지", () => {
    assert.equal(parseResumeInput({ survey: { targetRole: "" } }).ok, false);
    assert.equal(parseResumeInput({ survey: { targetRole: "백엔드", strengths: ["a", "b", "c", "d"] } }).ok, false);
    const ok = parseResumeInput({ survey: { targetRole: "백엔드", strengths: ["끈기", " "] } });
    assert.ok(ok.ok);
    assert.deepEqual(ok.value.strengths, ["끈기"]);
  });
});

// ---------- 라우트 ----------

let backend: MockBackend;
let user: TestUser;
let direction: (req: NextRequest) => Promise<Response>;
let repoInfo: (req: NextRequest) => Promise<Response>;

before(async () => {
  backend = await startMockBackend();
  process.env.NEXT_PUBLIC_API_URL = backend.url;
  process.env.OPENAI_API_KEY = "test-key";
  direction = (await import("@/app/api/ai/github-direction/route")).POST;
  repoInfo = (await import("@/app/api/github/repo-info/route")).GET;
});

after(async () => {
  await backend.close();
});

beforeEach(() => {
  backend.reset();
  resetOpenaiCalls();
  user = backend.createUser();
});

function authed(path: string, init: { method?: string; body?: unknown } = {}) {
  const token = backend.issueAccess(user);
  const cookies = { access_token: token };
  setCookieContext({ mode: "action", cookies });
  return new NextRequest(`http://localhost:3000${path}`, {
    method: init.method ?? "GET",
    headers: { "content-type": "application/json", cookie: `access_token=${token}` },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

describe("POST /api/ai/github-direction", () => {
  it("월 한도를 넘으면 OpenAI를 부르지 않고 429를 그대로 돌려준다", async () => {
    backend.route("GET /api/github/analysis", () => ({ status: 200, body: analysis() }));
    backend.route("POST /api/ai/usage/consume", () => ({ status: 429, body: { error: "이번 달 AI 사용 횟수(5회)를 모두 사용했습니다" } }));

    const res = await direction(authed("/api/ai/github-direction", { method: "POST", body: {} }));
    assert.equal(res.status, 429);
    assert.match((await res.json()).error, /모두 사용/);
    assert.equal(openaiCalls(), 0);
  });

  it("분석이 없으면 차감 없이 409", async () => {
    backend.route("GET /api/github/analysis", () => ({ status: 200, body: analysis({ status: "NONE", summary: null }) }));
    backend.route("POST /api/ai/usage/consume", () => ({ status: 200, body: {} }));

    const res = await direction(authed("/api/ai/github-direction", { method: "POST", body: {} }));
    assert.equal(res.status, 409);
    assert.equal(backend.countRequests("POST", "/api/ai/usage/consume"), 0);
  });

  it("차감 → 생성 → 결과 저장 순서로 진행한다", async () => {
    const saved: unknown[] = [];
    backend.route("GET /api/github/analysis", () => ({ status: 200, body: analysis() }));
    backend.route("POST /api/ai/usage/consume", () => ({ status: 200, body: { remaining: 4 } }));
    backend.route("PUT /api/github/analysis/direction", (req) => {
      saved.push(req.body);
      return { status: 204 };
    });
    const mock = (globalThis as unknown as { __openaiMock: { content: string } }).__openaiMock;
    const previous = mock.content;
    mock.content = JSON.stringify({ summary: "Spring 중심 백엔드", evidence: ["Java"], fits: ["API"], gaps: ["테스트"] });
    try {
      const res = await direction(authed("/api/ai/github-direction", { method: "POST", body: { targetRole: "백엔드" } }));
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.summary, "Spring 중심 백엔드");
      assert.deepEqual(body.gaps, ["테스트"]);
      assert.equal(openaiCalls(), 1);
      assert.equal(saved.length, 1);
      assert.equal(JSON.parse((saved[0] as { text: string }).text).targetRole, "백엔드");
    } finally {
      mock.content = previous;
    }
  });
});

describe("GET /api/github/repo-info", () => {
  it("토큰 원문 대신 백엔드 repo-files로 읽고 기술 스택을 감지한다", async () => {
    backend.route("GET /api/github/repo-files", (req) => ({
      status: 200,
      body: {
        name: req.query.get("repo") === "me/app" ? "app" : "?",
        description: "설명",
        homepage: "https://app.dev",
        languages: { TypeScript: 100 },
        files: { README: "# app\n", "package.json": JSON.stringify({ dependencies: { next: "16.0.0", react: "19" } }) },
        present: { Dockerfile: true },
      },
    }));

    const res = await repoInfo(authed("/api/github/repo-info?repo=me/app"));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.projectName, "app");
    assert.equal(body.deployUrl, "https://app.dev");
    assert.ok(body.techStack.length > 0);
    assert.equal(backend.countRequests("GET", "/api/github/token"), 0);
  });

  it("레포 이름 형식이 아니면 백엔드를 부르지 않는다", async () => {
    const res = await repoInfo(authed("/api/github/repo-info?repo=a/b/../../user"));
    assert.equal(res.status, 400);
    assert.equal(backend.countRequests("GET", "/api/github/repo-files"), 0);
  });
});
