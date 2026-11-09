import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cleanFeatures, hasTestFiles, isSlotFilled, sameValue, summarizeCommits, toAiDraft } from "@/lib/projectCard";
import { CARD_SLOTS } from "@/types/project";

// 프로젝트 자산화 (pofol/docs/2026-10-27-project-asset-plan.md) — 정리 카드 순수 함수
describe("정리 카드", () => {
  it("칸 순서는 백엔드 ProjectCard.SLOTS와 같다", () => {
    assert.deepEqual(
      [...CARD_SLOTS],
      ["oneLiner", "myRole", "features", "techReasons", "problemSolving", "results", "retrospective"],
    );
  });

  it("채운 칸 판단 — 글은 공백 제외, 기능은 1개 이상, 문제 해결은 4칸 중 하나라도", () => {
    assert.equal(isSlotFilled("  "), false);
    assert.equal(isSlotFilled("Spring"), true);
    assert.equal(isSlotFilled([]), false);
    assert.equal(isSlotFilled([{ name: "로그인", description: "", evidence: [] }]), true);
    assert.equal(isSlotFilled({ problem: "", cause: " ", solution: "", result: "" }), false);
    assert.equal(isSlotFilled({ problem: "", cause: "", solution: "락", result: "" }), true);
  });

  it("저장 전 이름이 빈 기능은 버리고 앞뒤 공백을 지운다", () => {
    assert.deepEqual(
      cleanFeatures([
        { name: " 로그인 ", description: " 유지 ", evidence: ["src/a.ts"] },
        { name: "   ", description: "버림", evidence: [] },
      ]),
      [{ name: "로그인", description: "유지", evidence: ["src/a.ts"] }],
    );
  });

  it("값 비교로 수정 여부를 판단한다", () => {
    assert.equal(sameValue("a", "a"), true);
    assert.equal(sameValue({ problem: "a", cause: "", solution: "", result: "" },
      { problem: "a", cause: "", solution: "", result: "" }), true);
    assert.equal(sameValue([], [{ name: "x", description: "", evidence: [] }]), false);
  });
});

describe("AI 정리 카드 초안", () => {
  const tree = ["src/app/login/page.tsx", "src/lib/auth.ts", "tests/auth.test.ts"];

  it("근거 경로가 트리에 없는 기능은 버리고, 비어 버린 칸은 skipped로", () => {
    const draft = toAiDraft(
      {
        oneLiner: "  면접용 포트폴리오 정리 서비스 ",
        features: [
          { name: "로그인", description: "이메일 로그인", evidence: ["src/lib/auth.ts", "src/nope.ts"] },
          { name: "지어낸 기능", description: "x", evidence: ["src/fake.ts"] },
        ],
        problemSolving: { problem: "토큰 만료", cause: "", solution: "" },
        techReasons: null,
        techCompare: [{ tech: "Next.js", alternatives: ["Remix"], question: "SSR이 필요했나요?" }],
        skipped: { myRole: "내 커밋이 없어요" },
      },
      tree,
    );
    assert.equal(draft.values.oneLiner, "면접용 포트폴리오 정리 서비스");
    assert.deepEqual(draft.values.features, [
      { name: "로그인", description: "이메일 로그인", evidence: ["src/lib/auth.ts"] },
    ]);
    assert.equal(draft.values.problemSolving, undefined); // 해결이 없으면 칸을 채우지 않는다
    assert.equal(draft.skipped.myRole, "내 커밋이 없어요");
    assert.equal(draft.skipped.problemSolving, "");
    assert.equal(draft.techCompare.length, 1);
  });

  it("기술 선택 이유를 썼으면 비교 안내는 내리지 않는다", () => {
    const draft = toAiDraft({ techReasons: "README에 적힌 이유", techCompare: [{ tech: "A", alternatives: ["B"] }] }, tree);
    assert.deepEqual(draft.techCompare, []);
    assert.equal(draft.skipped.techReasons, undefined);
  });

  it("커밋 요약 — 내 커밋 · 수정 커밋 첫 줄, 다른 기여자 수", () => {
    const s = summarizeCommits(
      [
        { author: "Me", message: "fix: 로그인 버그\n\n자세히", date: null },
        { author: "friend", message: "feat: 메인", date: null },
        { author: null, message: "init", date: null },
      ],
      "me",
    );
    assert.equal(s.mine, 1);
    assert.equal(s.otherAuthors, 1);
    assert.deepEqual(s.myMessages, ["fix: 로그인 버그"]);
    assert.deepEqual(s.fixMessages, ["fix: 로그인 버그"]);
    assert.equal(summarizeCommits([{ author: "me", message: "x", date: null }], null).mine, 0);
  });

  it("테스트 파일 감지", () => {
    assert.equal(hasTestFiles(tree), true);
    assert.equal(hasTestFiles(["src/App.tsx", "src/latest.ts"]), false);
  });
});
