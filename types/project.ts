// 백엔드 ProjectResponse와 1:1 대응 (api/docs/2026-10-27-project-asset-plan.md 3 · 5장)
import type { SentenceSource } from "./resume";

export type ProjectStage = "REGISTERED" | "DRAFT" | "ORGANIZED" | "INTERVIEW_READY";

/** 칸 출처 — 이력서 문장과 같은 값 (AI / SELF / VERIFIED) */
export type CardSource = SentenceSource;

/** 정리 카드 7칸 — 순서가 화면 순서다 */
export const CARD_SLOTS = [
  "oneLiner",
  "myRole",
  "features",
  "techReasons",
  "problemSolving",
  "results",
  "retrospective",
] as const;

export type CardSlot = (typeof CARD_SLOTS)[number];

export type ProjectFeature = { name: string; description: string; evidence: string[] };

export const PROBLEM_FIELDS = ["problem", "cause", "solution", "result"] as const;
export type ProblemSolving = Record<(typeof PROBLEM_FIELDS)[number], string>;

export type CardCell<T> = { value: T; source: CardSource };

export type ProjectCard = {
  oneLiner: CardCell<string>;
  myRole: CardCell<string>;
  features: CardCell<ProjectFeature[]>;
  techReasons: CardCell<string>;
  problemSolving: CardCell<ProblemSolving>;
  results: CardCell<string> & {
    /** GitHub 수집값 (S2부터 채워짐) */
    collected?: { homepage?: string; hasTests?: boolean; commitCount?: number };
  };
  retrospective: CardCell<string>;
};

export type CardValue<S extends CardSlot> = ProjectCard[S]["value"];

// ── 탭별 결과물 (백엔드 project.assets_json) ─────────────────────────

/** 기술 선택 이유를 레포에서 못 찾았을 때 — 비교해 볼 기술 */
export type TechCompare = { tech: string; alternatives: string[]; question: string };

/** 정리 카드 보조 정보 — AI 초안이 남긴 비운 이유 · 비교 기술 · 회고 질문 · 근거 커밋 */
export type CardHints = {
  skipped?: Partial<Record<CardSlot, string>>;
  techCompare?: TechCompare[];
  retroQuestions?: string[];
  problemCommit?: string | null;
};

export type ExplainData = {
  structure: { dir: string; role: string }[];
  flows: { name: string; steps: { label: string; path: string }[] }[];
  keyFiles: { path: string; role: string }[];
  designChoices: { topic: string; claim: string; evidence: string[]; isGuess: boolean }[];
};

export const QUESTION_TYPES = ["myCode", "framework", "troubleshooting", "techChoice", "expansion"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export type InterviewQuestion = {
  id: string;
  type: QuestionType;
  question: string;
  evidence: { paths: string[]; commit: string | null };
  /** 자주 나오는 면접 주제 (수집 스냅샷 기준, 없으면 null) */
  theme: string | null;
  goodAnswerPoints: string[];
  answer?: string | null;
  practicedAt?: string | null;
};

export type TechRecoItem = {
  id: string;
  name: string;
  icon: string | null;
  reason: string;
  firstStep: string;
  done: boolean;
};

export type ProjectAssets = {
  hints?: CardHints;
  explain?: { pushedAt: string; data: ExplainData };
  interview?: {
    pushedAt: string;
    questions: InterviewQuestion[];
    /** 질문 주제의 출처 (공개 면접 질문 모음 레포) */
    themeSources?: { repo: string; url: string }[];
  };
  techReco?: { generatedAt: string; role: string | null; source: string; items: TechRecoItem[] };
};

export type ProjectSummary = {
  uuid: string;
  repoFullName: string;
  stage: ProjectStage;
  filledSlots: number;
  displayOrder: number;
  updatedAt: string;
};

export type Project = ProjectSummary & {
  post: { uuid: string; title: string } | null;
  card: ProjectCard;
  assets?: ProjectAssets | null;
  createdAt: string;
};

export type GitHubRepoOption = { name: string; fullName: string };
