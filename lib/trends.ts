/**
 * 채용 트렌드 — GitHub 검색 API로 매달 자동 수집하는 지표 (pivot-summary 8.2).
 * 수집은 scripts/collect-trends.ts, 반영은 사람이 PR을 확인하고 머지한다.
 */

export const TREND_LANGUAGES = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "Kotlin",
  "Go",
  "Rust",
  "C++",
  "C#",
  "Swift",
  "Dart",
  "PHP",
] as const;

export type LanguageCount = { language: string; count: number };

export type GithubTrendSnapshot = {
  /** 집계 대상 달 "2026-10" */
  period: string;
  collectedAt: string;
  source: "GitHub Search API";
  sourceUrl: string;
  /** 전 세계 — 그 달에 새로 만들어진 공개 레포 수 (포크 제외) */
  globalNewRepos: LanguageCount[];
  /** 국내 — location에 "Korea"가 들어간 사용자 중 주 언어가 해당 언어인 사람 수 (누적) */
  koreaUsers: LanguageCount[];
  /** GitHub가 결과를 끝까지 세지 못했다고 알린 검색어 — 있으면 수치를 믿기 어렵다 */
  incomplete: string[];
};

/** 기준 시각의 지난달 — "2026-10", 2026-10-01..2026-10-31 */
export function previousMonth(now: Date): { period: string; from: string; to: string } {
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
  const day = (d: Date) => d.toISOString().slice(0, 10);
  return { period: day(first).slice(0, 7), from: day(first), to: day(last) };
}

export function share(counts: LanguageCount[], language: string): number {
  const total = counts.reduce((sum, c) => sum + c.count, 0);
  const hit = counts.find((c) => c.language === language);
  return total > 0 && hit ? hit.count / total : 0;
}

export type RankRow = { language: string; count: number; share: number; change: number | null };

/** 많은 순 정렬 + 비중 + 지난번 대비 비중 변화(%p, 0.01 = 1%p). 지난 데이터가 없으면 change는 null */
export function rankRows(current: LanguageCount[], previous: LanguageCount[] | null): RankRow[] {
  return [...current]
    .sort((a, b) => b.count - a.count)
    .map((c) => {
      const now = share(current, c.language);
      return {
        language: c.language,
        count: c.count,
        share: now,
        change: previous ? now - share(previous, c.language) : null,
      };
    });
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function rankLines(current: LanguageCount[], previous: LanguageCount[] | null, unit: string): string[] {
  return rankRows(current, previous).map((r, i) => {
    const change = r.change == null ? "" : ` (${r.change >= 0 ? "+" : ""}${(r.change * 100).toFixed(1)}%p)`;
    return `${i + 1}. ${r.language} — ${r.count.toLocaleString("en-US")}${unit} · ${pct(r.share)}${change}`;
  });
}

/** PR 본문 · 디스코드 알림에 쓰는 요약 (마크다운) */
export function summarize(current: GithubTrendSnapshot, previous: GithubTrendSnapshot | null): string {
  const lines = [
    `## 트렌드 수집 ${current.period}`,
    previous ? `비교: ${previous.period} 대비 비중 변화` : "비교할 지난 데이터 없음 (첫 수집)",
    "",
    "**전 세계 신규 레포**",
    ...rankLines(current.globalNewRepos, previous?.globalNewRepos ?? null, "개"),
    "",
    "**국내 사용자 주 언어** (location에 Korea)",
    ...rankLines(current.koreaUsers, previous?.koreaUsers ?? null, "명"),
  ];
  if (current.incomplete.length > 0) {
    lines.push("", `⚠️ GitHub가 끝까지 세지 못한 검색어 ${current.incomplete.length}개 — 수치 확인 필요: ${current.incomplete.join(", ")}`);
  }
  lines.push("", "확인 후 PR을 머지하면 반영됩니다. 이상하면 PR을 닫으세요.");
  return lines.join("\n");
}
