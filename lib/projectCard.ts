import {
  CARD_SLOTS,
  PROBLEM_FIELDS,
  type CardSlot,
  type CardValue,
  type ProblemSolving,
  type ProjectFeature,
} from "@/types/project";

/**
 * 정리 카드 화면이 쓰는 순수 함수 (네트워크 없음, 테스트 대상).
 * 채운 칸 판단은 백엔드 ProjectCard.filledSlots와 같은 기준이다.
 */

export const MAX_FEATURES = 5;

export function isSlotFilled(value: CardValue<CardSlot>): boolean {
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return PROBLEM_FIELDS.some((f) => (value[f] ?? "").trim() !== "");
}

/** 저장 전 정리 — 이름이 빈 기능은 버린다 (백엔드도 버리지만, 저장 후 입력란이 갑자기 사라지지 않게 미리) */
export function cleanFeatures(features: ProjectFeature[]): ProjectFeature[] {
  return features
    .map((f) => ({ ...f, name: f.name.trim(), description: f.description.trim() }))
    .filter((f) => f.name !== "");
}

export function sameValue(a: CardValue<CardSlot>, b: CardValue<CardSlot>): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ── AI 초안 (POST /api/ai/project-card) ──────────────────────────────

export type RepoCommit = { author: string | null; message: string; date: string | null };

export type TechCompare = { tech: string; alternatives: string[]; question: string };

export type AiDraft = {
  values: Partial<{ [S in CardSlot]: CardValue<S> }>;
  /** 근거가 없어 비워 둔 칸 → AI가 댄 이유 (없으면 빈 문자열) */
  skipped: Partial<Record<CardSlot, string>>;
  /** 기술 선택 이유를 레포에서 못 찾았을 때 — 비교해 볼 기술 */
  techCompare: TechCompare[];
};

const FIX_COMMIT = /\b(fix|bug|hotfix|refactor|perf|revert)\b|버그|수정|오류|에러|해결|개선/i;
const TEST_PATH = /(^|\/)(tests?|__tests__|spec)\/|\.(test|spec)\.[a-z]+$|Test\.(java|kt)$/;

/** AI에 보낼 커밋 요약 — 내 커밋 · 문제 해결 후보 커밋만 첫 줄로 */
export function summarizeCommits(commits: RepoCommit[], myLogin: string | null) {
  const firstLine = (c: RepoCommit) => c.message.split("\n")[0].trim().slice(0, 200);
  const me = myLogin?.toLowerCase();
  const mine = me ? commits.filter((c) => c.author?.toLowerCase() === me) : [];
  return {
    total: commits.length,
    mine: mine.length,
    otherAuthors: new Set(commits.map((c) => c.author?.toLowerCase()).filter((a) => a && a !== me)).size,
    myMessages: mine.slice(0, 60).map(firstLine),
    fixMessages: commits.filter((c) => FIX_COMMIT.test(c.message)).slice(0, 30).map(firstLine),
  };
}

export const hasTestFiles = (tree: string[]) => tree.some((p) => TEST_PATH.test(p));

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const strList = (v: unknown, maxItems: number, maxLen: number) =>
  Array.isArray(v) ? v.map((x) => str(x, maxLen)).filter(Boolean).slice(0, maxItems) : [];

/**
 * AI 응답을 칸 값으로 다듬는다. 기능 근거 경로는 실제 파일 트리에 있는 것만 남기고,
 * 근거가 하나도 남지 않은 기능은 버린다 (지어낸 기능 차단). 비어 버린 칸은 skipped로 돌린다.
 */
export function toAiDraft(raw: Record<string, unknown>, tree: string[]): AiDraft {
  const files = new Set(tree);
  const values: AiDraft["values"] = {};

  for (const slot of ["oneLiner", "myRole", "techReasons", "results", "retrospective"] as const) {
    const text = str(raw[slot], slot === "oneLiner" ? 200 : 3000);
    if (text) values[slot] = text;
  }

  const features = (Array.isArray(raw.features) ? raw.features : [])
    .map((f: Record<string, unknown>) => ({
      name: str(f?.name, 40),
      description: str(f?.description, 500),
      evidence: strList(f?.evidence, 5, 300).filter((p) => files.has(p)),
    }))
    .filter((f) => f.name && f.evidence.length > 0)
    .slice(0, MAX_FEATURES);
  if (features.length > 0) values.features = features;

  const ps = (raw.problemSolving ?? {}) as Record<string, unknown>;
  const problemSolving = Object.fromEntries(PROBLEM_FIELDS.map((f) => [f, str(ps[f], 3000)])) as ProblemSolving;
  if (problemSolving.problem && problemSolving.solution) values.problemSolving = problemSolving;

  const reasons = (raw.skipped ?? {}) as Record<string, unknown>;
  const skipped: AiDraft["skipped"] = {};
  for (const slot of CARD_SLOTS) {
    if (!(slot in values)) skipped[slot] = str(reasons[slot], 200);
  }

  const techCompare = (Array.isArray(raw.techCompare) ? raw.techCompare : [])
    .map((c: Record<string, unknown>) => ({
      tech: str(c?.tech, 40),
      alternatives: strList(c?.alternatives, 3, 40),
      question: str(c?.question, 200),
    }))
    .filter((c) => c.tech && c.alternatives.length > 0)
    .slice(0, 4);

  return { values, skipped, techCompare: values.techReasons ? [] : techCompare };
}
