/**
 * 지난달 트렌드 지표를 GitHub 검색 API로 모아 data/trends/github/YYYY-MM.json에 쓴다.
 * 요약은 SUMMARY_FILE(없으면 표준 출력)로 — 워크플로가 PR 본문 · 디스코드 알림에 쓴다.
 *
 * 실행: node --import ./tests/setup/register.mjs scripts/collect-trends.ts
 * 환경 변수: GITHUB_TOKEN (없어도 되지만 분당 10회로 느려진다)
 */
import fs from "node:fs";
import path from "node:path";
import {
  TREND_LANGUAGES,
  previousMonth,
  summarize,
  type GithubTrendSnapshot,
  type LanguageCount,
} from "@/lib/trends";
import { TRENDS_DIR as DIR, readSnapshots } from "@/lib/trends.server";

const token = process.env.GITHUB_TOKEN;
// 검색 API는 인증 시 분당 30회 — 넉넉히 띄운다
const GAP_MS = token ? 2500 : 7000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const incomplete: string[] = [];

async function count(kind: "repositories" | "users", q: string): Promise<number> {
  const url = `https://api.github.com/search/${kind}?per_page=1&q=${encodeURIComponent(q)}`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "pofol-trends",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    await sleep(GAP_MS);
    const res = await fetch(url, { headers });
    if (res.ok) {
      const body = (await res.json()) as { total_count: number; incomplete_results: boolean };
      if (body.incomplete_results) incomplete.push(q);
      return body.total_count;
    }
    if ((res.status === 403 || res.status === 429) && attempt === 0) {
      await sleep(Number(res.headers.get("retry-after") ?? 60) * 1000);
      continue;
    }
    throw new Error(`GitHub 검색 실패 ${res.status}: ${q}`);
  }
  throw new Error(`GitHub 검색 실패 (재시도 후): ${q}`);
}

async function each(query: (language: string) => [kind: "repositories" | "users", q: string]) {
  const result: LanguageCount[] = [];
  for (const language of TREND_LANGUAGES) {
    const [kind, q] = query(language);
    result.push({ language, count: await count(kind, q) });
  }
  return result;
}

const { period, from, to } = previousMonth(new Date());
const lang = (l: string) => `language:"${l}"`;

const snapshot: GithubTrendSnapshot = {
  period,
  collectedAt: new Date().toISOString(),
  source: "GitHub Search API",
  sourceUrl: "https://docs.github.com/en/rest/search/search",
  globalNewRepos: await each((l) => ["repositories", `${lang(l)} created:${from}..${to}`]),
  koreaUsers: await each((l) => ["users", `${lang(l)} location:Korea`]),
  incomplete,
};

fs.mkdirSync(DIR, { recursive: true });
fs.writeFileSync(path.join(DIR, `${period}.json`), JSON.stringify(snapshot, null, 2) + "\n");

const summary = summarize(snapshot, readSnapshots().filter((s) => s.period < period).at(-1) ?? null);
if (process.env.SUMMARY_FILE) fs.writeFileSync(process.env.SUMMARY_FILE, summary);
else console.log(summary);
