import type {
  AnalyzedRepo,
  DirectionResult,
  GitHubAnalysis,
  LanguageShare,
  ReadmeDecoration,
} from "@/types/githubAnalysis";
import type { ResumeContent, ResumeProject, Sentence } from "@/types/resume";

/**
 * 포트폴리오 코치 화면·AI 라우트가 함께 쓰는 순수 함수 (네트워크 없음, 테스트 대상).
 * AI에는 코드 원문 없이 이 요약만 보낸다 (기획 4장).
 */

/** groupLanguages가 "기타" 묶음에 붙이는 이름 — 화면이 번역한다 */
export const OTHER_LANGUAGE = "__other__";

/** 언어 비중 상위 N개 + 기타 (화면 막대용) */
export function groupLanguages(languages: LanguageShare[], top = 5): { name: string; ratio: number }[] {
  const head = languages.slice(0, top).map((l) => ({ name: l.name, ratio: l.ratio }));
  const rest = languages.slice(top).reduce((sum, l) => sum + l.ratio, 0);
  return rest > 0.0001 ? [...head, { name: OTHER_LANGUAGE, ratio: Math.round(rest * 10000) / 10000 }] : head;
}

/** 무시하지 않은 점검 항목 수 (레포 카드의 경고 개수) */
export function activeCheckCount(repo: AnalyzedRepo): number {
  return repo.checks.filter((c) => !c.ignored).length;
}

/** 점검 코드별 해당 레포 수 — "README 없음 4개" 요약 칩 */
export function checkTotals(repos: AnalyzedRepo[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const repo of repos) {
    for (const check of repo.checks) {
      if (check.ignored) continue;
      totals.set(check.code, (totals.get(check.code) ?? 0) + 1);
    }
  }
  return totals;
}

const EXCERPT_FOR_AI = 300;
const REPOS_FOR_AI = 15;

/** AI 프롬프트용 분석 요약 (README는 앞부분만, 커밋 메시지·코드 원문 없음) */
export function compactAnalysis(analysis: GitHubAnalysis) {
  const featured = new Set(analysis.featuredRepos);
  const top = new Set(analysis.topRepos.map((r) => r.fullName));
  const repos = [...analysis.repos]
    .sort((a, b) => Number(featured.has(b.fullName) || top.has(b.fullName)) - Number(featured.has(a.fullName) || top.has(a.fullName)))
    .slice(0, REPOS_FOR_AI)
    .map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      topics: r.topics,
      stars: r.stars,
      commits: r.commitCount,
      contributors: r.contributorCount,
      deployed: !!r.homepage,
      firstCommitToLastPush: periodLabel(r.createdAt, r.pushedAt),
      readme: r.readmeExcerpt?.slice(0, EXCERPT_FOR_AI) ?? null,
    }));
  return {
    repoCount: analysis.summary?.repoCount ?? null,
    languages: (analysis.summary?.languages ?? []).slice(0, 8).map((l) => `${l.name} ${Math.round(l.ratio * 100)}%`),
    activeRepos90d: analysis.summary?.activeRepos90d ?? 0,
    topRepos: analysis.topRepos.map((r) => r.fullName),
    featuredRepos: analysis.featuredRepos,
    repos,
  };
}

/** 두 시각 사이 기간 → "6주", "3개월" (없으면 null) */
export function periodLabel(from: string | null, to: string | null): string | null {
  if (!from || !to) return null;
  const days = (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000;
  if (!Number.isFinite(days) || days < 1) return null;
  if (days < 60) return `${Math.max(1, Math.round(days / 7))}주`;
  return `${Math.round(days / 30)}개월`;
}

/** 저장된 방향성(JSON 문자열) 해석. 예전 형식·손상된 값이면 요약 문장만 있는 것으로 본다 */
export function parseDirection(text: string | null): DirectionResult | null {
  if (!text) return null;
  try {
    const value = JSON.parse(text) as Partial<DirectionResult>;
    if (typeof value?.summary !== "string") throw new Error();
    const list = (v: unknown) =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
    return {
      summary: value.summary,
      evidence: list(value.evidence),
      fits: list(value.fits),
      gaps: list(value.gaps),
      targetRole: typeof value.targetRole === "string" ? value.targetRole : null,
    };
  } catch {
    return { summary: text, evidence: [], fits: [], gaps: [], targetRole: null };
  }
}

// ---------- 프로필 README ----------

export type ReadmeSkill = { name: string; iconSlug: string; badgeColor: string };

export type ReadmeOptions = {
  login: string;
  decorations: ReadmeDecoration[];
  skills: ReadmeSkill[];
  solvedacId?: string | null;
  blogRss?: string | null;
};

function badge(skill: ReadmeSkill): string {
  const label = encodeURIComponent(skill.name.replace(/-/g, "--").replace(/_/g, "__"));
  const color = (skill.badgeColor || "555555").replace(/^#/, "");
  const logo = skill.iconSlug ? `&logo=${encodeURIComponent(skill.iconSlug)}&logoColor=white` : "";
  return `![${skill.name}](https://img.shields.io/badge/${label}-${color}?style=flat-square${logo})`;
}

/**
 * 꾸미기 요소 마크다운. AI가 URL을 지어내지 않도록 장식은 코드로 만든다.
 * 헤더 배너는 맨 위, 나머지는 맨 아래(구성 순서: 소개 → 대표 프로젝트 → 기술 스택 → 연락처 → 통계·장식).
 */
export function readmeDecorations(options: ReadmeOptions): { header: string; stack: string; footer: string } {
  const has = (d: ReadmeDecoration) => options.decorations.includes(d);
  const login = encodeURIComponent(options.login);

  const header = has("header")
    ? `![header](https://capsule-render.vercel.app/api?type=waving&height=160&text=${login}&fontAlignY=35&color=gradient)\n`
    : "";

  const stack =
    has("badges") && options.skills.length > 0
      ? `## 🛠 Tech Stack\n\n${options.skills.map(badge).join(" ")}\n`
      : "";

  const footer: string[] = [];
  if (has("stats")) {
    footer.push(
      `![GitHub Stats](https://github-readme-stats.vercel.app/api?username=${login}&show_icons=true)`,
    );
  }
  if (has("streak")) {
    footer.push(`![GitHub Streak](https://streak-stats.demolab.com?user=${login})`);
  }
  if (has("solvedac") && options.solvedacId) {
    const id = encodeURIComponent(options.solvedacId);
    footer.push(`[![solved.ac](http://mazassumnida.wtf/api/v2/generate_badge?boj=${id})](https://solved.ac/${id})`);
  }
  if (has("blog")) {
    footer.push(
      "## 📝 Latest Blog Posts\n\n<!-- BLOG-POST-LIST:START -->\n<!-- BLOG-POST-LIST:END -->",
    );
  }

  return {
    header,
    stack,
    footer: footer.length > 0 ? `\n${footer.join("\n\n")}\n` : "",
  };
}

/** blog-post-workflow용 GitHub Actions 파일 (README에 넣지 않고 따로 복사하게 보여준다) */
export function blogWorkflowYaml(rssUrl: string): string {
  return `name: Latest blog post workflow
on:
  schedule:
    - cron: "0 0 * * *"
  workflow_dispatch:
permissions:
  contents: write
jobs:
  update-readme-with-blog:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: gautamkrishnar/blog-post-workflow@v1
        with:
          feed_list: "${rssUrl}"
`;
}

/** AI가 쓴 본문(소개·대표 프로젝트·연락처)과 코드로 만든 장식을 정해진 순서로 합친다 */
export function assembleReadme(
  ai: { intro: string; projects: string; contact: string },
  options: ReadmeOptions,
): string {
  const deco = readmeDecorations(options);
  return [deco.header, ai.intro.trim(), ai.projects.trim(), deco.stack.trim(), ai.contact.trim(), deco.footer.trim()]
    .filter((part) => part.length > 0)
    .join("\n\n")
    .concat("\n");
}

// ---------- 이력서 ----------

/** GitHub 수집값으로만 만든 검증 문장 — AI가 출처를 주장하지 않도록 라우트가 직접 붙인다 */
export function verifiedFacts(repo: AnalyzedRepo | undefined): Sentence[] {
  if (!repo) return [];
  const facts: Sentence[] = [];
  if (repo.commitCount != null && repo.commitCount > 0) {
    facts.push({ text: `커밋 약 ${repo.commitCount}개`, source: "VERIFIED" });
  }
  const period = periodLabel(repo.createdAt, repo.pushedAt);
  if (period) facts.push({ text: `개발 기간 약 ${period}`, source: "VERIFIED" });
  if (repo.contributorCount != null && repo.contributorCount >= 2) {
    facts.push({ text: `${repo.contributorCount}인 협업`, source: "VERIFIED" });
  }
  if (repo.homepage) facts.push({ text: "배포 링크 있음", source: "VERIFIED" });
  return facts;
}

/** 편집하면 출처가 본인 작성(SELF)으로 바뀐다 — 검증 문장도 고치면 더 이상 GitHub 값이 아니다 */
export function editSentence(sentence: Sentence, text: string): Sentence {
  return text === sentence.text ? sentence : { text, source: "SELF" };
}

export function emptyResumeContent(): ResumeContent {
  return { headline: { text: "", source: "SELF" }, summary: [], projects: [], skills: [] };
}

export function newProject(name = ""): ResumeProject {
  return { name, repoFullName: null, role: { text: "", source: "SELF" }, facts: [], highlights: [] };
}
