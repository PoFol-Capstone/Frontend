// 백엔드 ProjectResponse와 1:1 대응 (api/docs/plan-2026-10-27-project-asset.md 3 · 5장)
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
  createdAt: string;
};

export type GitHubRepoOption = { name: string; fullName: string };
