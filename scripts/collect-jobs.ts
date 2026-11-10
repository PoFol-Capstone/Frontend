/**
 * 기업 공개 채용 API(Greenhouse)에서 국내 개발 공고를 모아 필수 · 우대 기술을 집계하고
 * data/trends/jobs/YYYY-MM.json에 쓴다. 요약은 SUMMARY_FILE(없으면 표준 출력)로 — 워크플로가 PR · 디스코드에 쓴다.
 *
 * 실행: node --import ./tests/setup/register.mjs scripts/collect-jobs.ts
 * 공고 본문은 저장하지 않는다 (회사 · 제목 · 링크 · 기술만).
 */
import fs from "node:fs";
import path from "node:path";
import { extractJobTech, htmlToText } from "@/lib/jobTech";
import {
  JOB_SOURCES,
  aggregateJobs,
  classifyRole,
  isKoreaLocation,
  summarizeJobs,
  type JobPosting,
  type JobTrendSnapshot,
} from "@/lib/jobTrends";
import { JOBS_DIR as DIR, readSnapshots } from "@/lib/trends.server";

type GreenhouseJob = {
  title: string;
  absolute_url: string;
  content: string;
  location?: { name?: string };
};

async function fetchBoard(slug: string): Promise<GreenhouseJob[]> {
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`, {
    headers: { "User-Agent": "pofol-trends" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Greenhouse ${slug} ${res.status}`);
  return ((await res.json()) as { jobs: GreenhouseJob[] }).jobs;
}

const postings: JobPosting[] = [];
const sources: JobTrendSnapshot["sources"] = [];

for (const { slug, company } of JOB_SOURCES) {
  const url = `https://boards.greenhouse.io/${slug}`;
  try {
    let n = 0;
    for (const job of await fetchBoard(slug)) {
      if (!isKoreaLocation(job.location?.name ?? "")) continue;
      const role = classifyRole(job.title);
      if (!role) continue;
      postings.push({ company, title: job.title.trim(), url: job.absolute_url, role, ...extractJobTech(htmlToText(job.content)) });
      n++;
    }
    sources.push({ company, url, postings: n });
  } catch (err) {
    // 한 회사가 실패해도 나머지는 집계 — 요약에 실패를 표시한다
    sources.push({ company, url, postings: 0, error: String(err) });
  }
}

if (postings.length === 0) throw new Error(`공고를 하나도 모으지 못했습니다: ${JSON.stringify(sources)}`);

const now = new Date();
const snapshot: JobTrendSnapshot = {
  period: now.toISOString().slice(0, 7),
  collectedAt: now.toISOString(),
  source: "Greenhouse Job Board API",
  sources,
  ...aggregateJobs(postings),
  postings,
};

fs.mkdirSync(DIR, { recursive: true });
fs.writeFileSync(path.join(DIR, `${snapshot.period}.json`), JSON.stringify(snapshot, null, 2) + "\n");

const previous = readSnapshots<JobTrendSnapshot>(DIR).filter((s) => s.period < snapshot.period).at(-1) ?? null;
const summary = summarizeJobs(snapshot, previous);
if (process.env.SUMMARY_FILE) fs.writeFileSync(process.env.SUMMARY_FILE, summary);
else console.log(summary);
