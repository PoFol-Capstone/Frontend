/**
 * 공개 면접 질문 모음 GitHub 레포에서 "자주 나오는 질문 주제"를 모아
 * data/trends/interview/YYYY-MM.json에 쓴다. 질문 전문이 아니라 문서 제목(주제)만 발췌하고,
 * 항목마다 출처 레포를 남긴다. 라이선스는 GitHub API가 알려 주는 값을 그대로 기록한다.
 *
 * 실행: node --import ./tests/setup/register.mjs scripts/collect-interview-themes.ts
 * GITHUB_TOKEN이 있으면 호출 한도가 넉넉해진다 (없어도 레포당 2회라 동작).
 */
import fs from "node:fs";
import path from "node:path";
import { findTech } from "@/lib/jobTech";
import {
  INTERVIEW_THEMES_DIR as DIR,
  type InterviewTheme,
  type InterviewThemeSnapshot,
  type ThemeSource,
} from "@/lib/interviewThemes.server";

/** 수집 대상 — 널리 알려진 한국어 기술 면접 질문 모음 (주제 = 마크다운 문서 제목) */
const SOURCE_REPOS = [
  "gyoogle/tech-interview-for-developer",
  "WeareSoft/tech-interview",
  "JaeYeopHan/Interview_Question_for_Beginner",
];

const MAX_THEMES_PER_TECH = 8;
const THEME_MIN = 4;
const THEME_MAX = 80;

async function gh(pathname: string): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = { "User-Agent": "pofol-trends", Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com${pathname}`, { headers, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`GitHub ${pathname} ${res.status}`);
  return (await res.json()) as Record<string, unknown>;
}

/** "[Java] 직렬화(Serialization).md" → "직렬화(Serialization)" — 태그 · 번호 접두사 · 확장자 제거 */
function toTheme(filename: string): string | null {
  const base = filename
    .replace(/\.(md|markdown)$/i, "")
    .replace(/^\[[^\]]*\]\s*/, "")
    .replace(/^[\d.\-_ ]+/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\d+$/, "")
    .trim();
  if (base.length < THEME_MIN || base.length > THEME_MAX) return null;
  if (/^(readme|contributing|license|index|summary|sidebar)$/i.test(base)) return null;
  // 기술 이름 한 단어뿐인 제목("javascript", "Nuxt.js")은 주제가 아니다
  if (!base.includes(" ") && findTech(base).length > 0) return null;
  return base;
}

const sources: ThemeSource[] = [];
// 기술 id → 주제 이름 → {count, source}
const byTech = new Map<string, Map<string, InterviewTheme>>();

for (const repo of SOURCE_REPOS) {
  const url = `https://github.com/${repo}`;
  try {
    const meta = await gh(`/repos/${repo}`);
    const license = (meta.license as { spdx_id?: string } | null)?.spdx_id ?? null;
    const tree = (await gh(`/repos/${repo}/git/trees/HEAD?recursive=1`)) as unknown as {
      tree: { path: string; type: string }[];
    };

    let count = 0;
    for (const entry of tree.tree) {
      if (entry.type !== "blob" || !/\.(md|markdown)$/i.test(entry.path)) continue;
      const theme = toTheme(entry.path.split("/").pop()!);
      if (!theme) continue;
      // 경로 전체(폴더 이름 포함)로 기술을 찾는다 — "Language/Java/..." → java
      const techIds = findTech(entry.path.replace(/[/_-]+/g, " "));
      if (techIds.length === 0) continue;
      count++;
      for (const id of techIds) {
        const themes = byTech.get(id) ?? new Map<string, InterviewTheme>();
        const existing = themes.get(theme);
        if (existing) existing.count++;
        else themes.set(theme, { theme, count: 1, source: repo });
        byTech.set(id, themes);
      }
    }
    sources.push({ repo, url, license, themes: count, fetchedAt: new Date().toISOString() });
  } catch (err) {
    // 한 레포가 실패해도 나머지는 집계
    sources.push({ repo, url, license: null, themes: 0, fetchedAt: new Date().toISOString() });
    console.error(`${repo} 수집 실패: ${String(err)}`);
  }
}

const collected = sources.reduce((n, s) => n + s.themes, 0);
if (collected === 0) throw new Error(`주제를 하나도 모으지 못했습니다: ${JSON.stringify(sources)}`);

const themes: InterviewThemeSnapshot["themes"] = {};
for (const [id, map] of byTech) {
  themes[id] = [...map.values()]
    .sort((a, b) => b.count - a.count || a.theme.localeCompare(b.theme))
    .slice(0, MAX_THEMES_PER_TECH);
}

const now = new Date();
const snapshot: InterviewThemeSnapshot = {
  period: now.toISOString().slice(0, 7),
  collectedAt: now.toISOString(),
  sources,
  themes,
};

fs.mkdirSync(DIR, { recursive: true });
fs.writeFileSync(path.join(DIR, `${snapshot.period}.json`), JSON.stringify(snapshot, null, 2) + "\n");

const lines = [
  `## 면접 질문 주제 수집 (${snapshot.period})`,
  "",
  `기술 ${Object.keys(themes).length}개, 주제 ${collected}건 (문서 제목만 발췌, 출처 기록)`,
  ...sources.map((s) => `- ${s.repo} — ${s.themes}건${s.license ? ` (${s.license})` : ""}${s.themes === 0 ? " ⚠️ 실패" : ""}`),
];
const summary = lines.join("\n");
if (process.env.SUMMARY_FILE) fs.writeFileSync(process.env.SUMMARY_FILE, summary);
else console.log(summary);
