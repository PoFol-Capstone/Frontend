import {
  CARD_SLOTS,
  PROBLEM_FIELDS,
  type CardHints,
  type CardSlot,
  type CardValue,
  type ProblemSolving,
  type ProjectFeature,
  type TechCompare,
} from "@/types/project";

export type { TechCompare };

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

export type RepoCommit = { sha: string | null; author: string | null; message: string; date: string | null };

/** 백엔드 GET /api/github/repo-context 응답 (RepoContextResponse) — AI 라우트들이 공유 */
export type RepoContext = {
  repo: {
    name: string;
    description: string | null;
    homepage: string | null;
    languages: Record<string, number>;
    files: Record<string, string | null>;
    present: Record<string, boolean>;
  };
  myLogin: string | null;
  tree: string[];
  commits: RepoCommit[];
  pushedAt: string;
  /** 핵심 파일 내용 — 경로 점수로 선별, 파일당 3,000자, 비밀값 가림 */
  keyFiles: { path: string; content: string }[];
  /** 내가 고친 폴더 상위 10개 (내 커밋 ?author= 기준) */
  myFiles: { path: string; commits: number }[];
  /** 문제 해결 후보 커밋 — 실제 변경 내용(patch) 포함 */
  fixCandidates: { sha: string; message: string; files: string[]; patch: string }[];
};

export type AiDraft = {
  values: Partial<{ [S in CardSlot]: CardValue<S> }>;
  /** 화면 보조 정보 — 백엔드 assets.hints로 저장돼 새로고침해도 남는다 */
  hints: Required<Pick<CardHints, "skipped" | "techCompare" | "retroQuestions" | "problemCommit">>;
};

/**
 * 내 역할 칸의 첫 문장 — 수치 · 영역은 AI가 아니라 코드가 쓴다 (AI 심층 기획 3.1).
 * 내 커밋이 하나도 안 잡히면 null (화면이 Git 이메일 연결 안내를 띄운다).
 */
export function myRoleLead(ctx: Pick<RepoContext, "myFiles" | "commits" | "myLogin">): string | null {
  const { mine, otherAuthors, total } = summarizeCommits(ctx.commits, ctx.myLogin);
  const folders = ctx.myFiles.slice(0, 3).map((f) => f.path).join(" · ");
  if (otherAuthors === 0 && mine > 0) {
    return folders ? `1인 개발 — ${folders} 중심으로 커밋 ${mine}개 작성.` : `1인 개발 — 커밋 ${mine}개 모두 직접 작성.`;
  }
  if (mine > 0) {
    const share = total > 0 ? ` (최근 ${total}개 중 ${Math.round((100 * mine) / total)}%)` : "";
    return folders
      ? `팀 프로젝트 — ${folders} 중심, 커밋 ${mine}개 작성${share}.`
      : `팀 프로젝트 — 커밋 ${mine}개 작성${share}.`;
  }
  return null;
}

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
 * AI 응답을 칸 값으로 다듬는다. 기능 근거 경로는 실제 파일 트리에 있는 것만,
 * 문제 해결의 근거 커밋은 실제 fix 후보에 있는 것만 남긴다 (지어낸 근거 차단).
 * results는 AI가 아니라 사실 정리(facts)가 채우므로 여기서 무시한다.
 */
export function toAiDraft(raw: Record<string, unknown>, tree: string[], fixShas: ReadonlySet<string>): AiDraft {
  const files = new Set(tree);
  const values: AiDraft["values"] = {};

  for (const slot of ["oneLiner", "myRole", "techReasons", "retrospective"] as const) {
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
  const commit = str(ps.commit, 64);
  const problemCommit = values.problemSolving && commit && fixShas.has(commit) ? commit : null;

  const reasons = (raw.skipped ?? {}) as Record<string, unknown>;
  const skipped: CardHints["skipped"] = {};
  for (const slot of CARD_SLOTS) {
    if (slot !== "results" && !(slot in values)) skipped[slot] = str(reasons[slot], 200);
  }

  const techCompare = (Array.isArray(raw.techCompare) ? raw.techCompare : [])
    .map((c: Record<string, unknown>) => ({
      tech: str(c?.tech, 40),
      alternatives: strList(c?.alternatives, 3, 40),
      question: str(c?.question, 200),
    }))
    .filter((c) => c.tech && c.alternatives.length > 0)
    .slice(0, 4);

  // 회고가 없을 때 스스로 답해 볼 질문 — 레포 점검 결과 기반
  const retroQuestions = values.retrospective ? [] : strList(raw.retroQuestions, 3, 200);

  return {
    values,
    hints: { skipped, techCompare: values.techReasons ? [] : techCompare, retroQuestions, problemCommit },
  };
}
