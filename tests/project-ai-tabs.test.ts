import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { practiceOrder, toExplainData, toInterviewBank } from "@/lib/projectAssets";
import { buildTechReco, detectedTech, resolveRole } from "@/lib/techReco";
import { cardFeedbackPrompt, interviewFeedbackPrompt } from "@/lib/feedbackPrompt";
import type { JobTrendSnapshot, RoleStat } from "@/lib/jobTrends";
import type { InterviewQuestion, Project } from "@/types/project";

// 구현 설명 · 면접 연습 · 기술 추천 (docs/2026-11-10-project-ai-depth-plan.md P3~P5) — 순수 함수 검증

const tree = ["src/pages/Home.tsx", "src/api/search.ts", "src/store/auth.ts"];

describe("구현 설명 검증", () => {
  it("트리에 없는 경로가 달린 단계 · 파일 · 근거는 버린다", () => {
    const data = toExplainData(
      {
        structure: [{ dir: "src", role: "화면" }, { dir: "ghost", role: "없는 폴더" }],
        flows: [
          { name: "검색", steps: [
            { label: "버튼 클릭", path: "src/pages/Home.tsx" },
            { label: "API 호출", path: "src/api/search.ts" },
            { label: "지어낸 단계", path: "src/fake.ts" },
          ] },
          { name: "짧은 흐름", steps: [{ label: "하나뿐", path: "src/pages/Home.tsx" }] },
        ],
        keyFiles: [{ path: "src/api/search.ts", role: "검색 API" }, { path: "nope.ts", role: "x" }],
        designChoices: [
          { topic: "상태 관리", claim: "스토어 하나로 관리", evidence: ["src/store/auth.ts"], isGuess: false },
          { topic: "추정 선택", claim: "근거 없음", evidence: ["src/fake.ts"], isGuess: false },
        ],
      },
      tree,
    );
    assert.ok(data);
    assert.deepEqual(data.structure.map((s) => s.dir), ["src"]);
    assert.equal(data.flows.length, 1); // 2단계 미만 흐름은 버린다
    assert.equal(data.flows[0].steps.length, 2);
    assert.deepEqual(data.keyFiles.map((k) => k.path), ["src/api/search.ts"]);
    assert.equal(data.designChoices[0].isGuess, false);
    assert.equal(data.designChoices[1].isGuess, true); // 근거가 다 버려지면 추정으로 강등
  });

  it("전부 비면 null — 근거 없음", () => {
    assert.equal(toExplainData({ structure: [], flows: [], keyFiles: [] }, tree), null);
  });
});

describe("면접 질문 은행 검증", () => {
  const shas = new Set(["fix1"]);
  const themes = ["리렌더링 최적화"];
  const q = (over: Record<string, unknown>) => ({
    type: "myCode",
    question: "로그인 상태를 어떻게 유지했나요?",
    evidence: { paths: ["src/store/auth.ts"], commit: null },
    goodAnswerPoints: ["저장 위치", "만료 처리", "보안"],
    ...over,
  });

  it("유형 · 경로 · 커밋 · 주제를 화이트리스트로 거른다", () => {
    const bank = toInterviewBank(
      {
        questions: [
          q({}),
          q({ type: "trick" }), // 모르는 유형
          q({ evidence: { paths: ["src/fake.ts"], commit: "made-up" } }), // 근거가 전부 가짜 → 버림
          q({ type: "troubleshooting", evidence: { paths: [], commit: "fix1" } }),
          q({ type: "framework", theme: "리렌더링 최적화" }),
          q({ type: "framework", theme: "없는 주제" }), // 주제만 지우고 질문은 유지
          q({ type: "techChoice" }),
        ],
      },
      tree,
      shas,
      themes,
    );
    assert.ok(bank);
    assert.equal(bank.length, 5);
    assert.deepEqual(bank.map((b) => b.id), ["q1", "q2", "q3", "q4", "q5"]);
    assert.equal(bank[1].evidence.commit, "fix1");
    assert.equal(bank[2].theme, "리렌더링 최적화");
    assert.equal(bank[3].theme, null);
  });

  it("5개 미만이면 null", () => {
    assert.equal(toInterviewBank({ questions: [q({}), q({})] }, tree, shas, themes), null);
  });

  it("연습 순서 — 안 한 질문 먼저, 그다음 오래된 연습 순", () => {
    const qs = [
      { id: "a", practicedAt: "2026-11-02" },
      { id: "b", practicedAt: null },
      { id: "c", practicedAt: "2026-11-01" },
    ] as InterviewQuestion[];
    assert.deepEqual(practiceOrder(qs).map((x) => x.id), ["b", "c", "a"]);
  });
});

describe("기술 추천 (AI 없음)", () => {
  const repo = (files: Record<string, string | null>, present: Record<string, boolean> = {}) => ({
    repo: { name: "app", description: null, homepage: null, languages: { TypeScript: 100 }, files, present },
  });
  const pkg = JSON.stringify({ dependencies: { react: "^19", next: "^16" } });

  it("직군 라벨 매핑", () => {
    assert.equal(resolveRole("프론트엔드 개발자"), "frontend");
    assert.equal(resolveRole("Backend Engineer"), "backend");
    assert.equal(resolveRole("데이터 엔지니어"), "data");
    assert.equal(resolveRole(null), null);
    assert.equal(resolveRole("게임 기획"), null);
  });

  it("레포 기술 감지 — npm 의존성 + 언어", () => {
    const ids = detectedTech(repo({ "package.json": pkg }).repo).map((t) => t.id);
    assert.ok(ids.includes("react"));
    assert.ok(ids.includes("nextjs"));
    assert.ok(ids.includes("typescript"));
  });

  it("추천 = 우대 − 감지, 최대 5개, 아이콘 포함", () => {
    const stat: RoleStat = {
      postings: 40,
      required: [],
      preferred: [
        { id: "react", count: 30 }, // 감지됨 → 제외
        { id: "testing", count: 25 },
        { id: "ssr", count: 20 },
        { id: "docker", count: 18 },
        { id: "kubernetes", count: 10 },
        { id: "terraform", count: 8 },
        { id: "linux", count: 6 },
      ],
    };
    const snapshot = { period: "2026-11", roles: { frontend: stat }, all: stat } as unknown as JobTrendSnapshot;
    const reco = buildTechReco(repo({ "package.json": pkg }), snapshot, "프론트엔드", []);
    assert.equal(reco.role, "frontend");
    assert.equal(reco.source, "jobs-2026-11");
    assert.equal(reco.items.length, 5);
    assert.ok(!reco.items.some((i) => i.id === "react"));
    assert.equal(reco.items[0].id, "testing");
    assert.equal(reco.items.find((i) => i.id === "docker")?.icon, "docker");
    assert.ok(reco.items[0].reason.includes("우대 25건"));
    assert.ok(reco.items[0].firstStep.length > 0);
  });

  it("스냅샷이 없으면 폴백 — CI 있으면 cicd 제외, 이전 체크 유지", () => {
    const reco = buildTechReco(
      repo({ "package.json": pkg }, { ".github/workflows": true }),
      null,
      "프론트엔드",
      [{ id: "testing", name: "테스트 코드", icon: null, reason: "", firstStep: "", done: true }],
    );
    assert.equal(reco.source, "fallback");
    assert.ok(!reco.items.some((i) => i.id === "cicd"));
    assert.equal(reco.items.find((i) => i.id === "testing")?.done, true);
  });
});

describe("피드백 프롬프트 추출", () => {
  const cell = <T,>(value: T) => ({ value, source: "SELF" as const });
  const project = {
    uuid: "u1",
    repoFullName: "me/app",
    card: {
      oneLiner: cell("면접 정리 서비스"),
      myRole: cell(""),
      features: cell([{ name: "로그인", description: "JWT", evidence: ["src/auth.ts"] }]),
      techReasons: cell(""),
      problemSolving: cell({ problem: "토큰 만료", cause: "", solution: "재발급", result: "" }),
      results: cell(""),
      retrospective: cell(""),
    },
    assets: {
      interview: {
        pushedAt: "",
        questions: [
          { id: "q1", type: "myCode", question: "어떻게 유지했나요?", evidence: { paths: [], commit: null },
            theme: null, goodAnswerPoints: ["요소"], answer: "쿠키에 저장했어요", practicedAt: "2026-11-11" },
          { id: "q2", type: "myCode", question: "안 한 질문", evidence: { paths: [], commit: null },
            theme: null, goodAnswerPoints: ["요소"], answer: null, practicedAt: null },
        ],
      },
    },
  } as unknown as Project;

  it("채운 칸만 담고 레포 이름과 역할 지시가 들어간다", () => {
    const prompt = cardFeedbackPrompt(project);
    assert.ok(prompt.includes("me/app"));
    assert.ok(prompt.includes("## 한 줄 소개"));
    assert.ok(prompt.includes("- 로그인: JWT (src/auth.ts)"));
    assert.ok(prompt.includes("- 문제: 토큰 만료"));
    assert.ok(!prompt.includes("## 회고"));
  });

  it("면접 프롬프트는 답을 쓴 질문만, 없으면 빈 문자열", () => {
    const prompt = interviewFeedbackPrompt(project);
    assert.ok(prompt.includes("어떻게 유지했나요?"));
    assert.ok(!prompt.includes("안 한 질문"));
    assert.equal(interviewFeedbackPrompt({ ...project, assets: {} } as Project), "");
  });
});
