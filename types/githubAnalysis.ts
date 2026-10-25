// 백엔드 GitHubAnalysisResponse·PublicGitHubResponse와 1:1 대응 (api/docs/plan-2026-10-25-portfolio-coach.md 5장)

export type AnalysisStatus = "NONE" | "ANALYZING" | "DONE" | "FAILED";

/** 백엔드 RepoCheckRule — 문구·해결 가이드는 messages의 profile.github.checks.{code} */
export type CheckCode =
  | "NO_README"
  | "NO_DESCRIPTION"
  | "NO_HOMEPAGE"
  | "NO_TESTS"
  | "TOO_FEW_COMMITS"
  | "WEAK_COMMIT_MESSAGES"
  | "FORK_HEAVY"
  | "NO_PROFILE_README";

/** 백엔드 RepoScorer 근거 코드 — 점수 숫자는 내려오지 않는다 */
export type TopRepoReason =
  | "RICH_README"
  | "DEPLOYED"
  | "ACTIVE_HISTORY"
  | "LONG_RUNNING"
  | "TEAM_PROJECT"
  | "STARRED"
  | "RECENT";

export type RepoCheck = { code: CheckCode; ignored: boolean };

export type LanguageShare = { name: string; bytes: number; ratio: number };

export type AnalysisSummary = {
  repoCount: { owned: number; forked: number };
  totalStars: number;
  languages: LanguageShare[];
  activeRepos90d: number;
  lastPushedAt: string | null;
  hasProfileReadme: boolean;
};

export type AnalyzedRepo = {
  fullName: string;
  name: string;
  description: string | null;
  topics: string[];
  homepage: string | null;
  language: string | null;
  stars: number;
  createdAt: string | null;
  pushedAt: string | null;
  commitCount: number | null;
  contributorCount: number | null;
  readmeLength: number | null;
  readmeExcerpt: string | null;
  checks: RepoCheck[];
  /** 일부 GitHub 호출이 실패해 판단하지 못한 항목이 있음 */
  partial: boolean;
};

export type TopRepo = { fullName: string; reasons: TopRepoReason[] };

export type GitHubVisibility = {
  summary: boolean;
  languages: boolean;
  topRepos: boolean;
  direction: boolean;
};

export type GitHubAnalysis = {
  status: AnalysisStatus;
  failureReason: string | null;
  analyzedAt: string | null;
  login: string | null;
  summary: AnalysisSummary | null;
  accountChecks: RepoCheck[];
  repos: AnalyzedRepo[];
  topRepos: TopRepo[];
  featuredRepos: string[];
  direction: string | null;
  profileReadmeDraft: string | null;
  visibility: GitHubVisibility;
};

export type PublicFeaturedRepo = {
  fullName: string;
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  homepage: string | null;
};

export type PublicGitHub = {
  summary: AnalysisSummary | null;
  languages: LanguageShare[] | null;
  topRepos: TopRepo[] | null;
  direction: string | null;
  featuredRepos: PublicFeaturedRepo[];
};

export type AiFeature = "github-direction" | "profile-readme" | "resume";

export type AiFeatureUsage = {
  feature: AiFeature;
  used: number;
  limit: number;
  remaining: number;
};

export type AiUsage = { month: string; features: AiFeatureUsage[] };

/** AI 방향성 결과 — 백엔드에는 JSON 문자열로 저장한다 (direction_text) */
export type DirectionResult = {
  summary: string;
  evidence: string[];
  fits: string[];
  gaps: string[];
  targetRole: string | null;
};

/** 프로필 README 꾸미기 요소 (기획 3.3) */
export type ReadmeDecoration =
  | "badges"
  | "stats"
  | "streak"
  | "header"
  | "solvedac"
  | "blog";
