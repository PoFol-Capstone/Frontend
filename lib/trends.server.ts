import fs from "node:fs";
import path from "node:path";
import type { GithubTrendSnapshot } from "@/lib/trends";
import type { UiPost } from "@/lib/uiTrends";

export const TRENDS_DIR = path.join(process.cwd(), "data", "trends", "github");
export const JOBS_DIR = path.join(process.cwd(), "data", "trends", "jobs");

/** 저장된 월별 스냅샷 — 오래된 것부터. 폴더가 없으면 빈 배열 */
export function readSnapshots<T = GithubTrendSnapshot>(dir = TRENDS_DIR): T[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /^\d{4}-\d{2}\.json$/.test(f))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as T);
}

export const UI_POSTS_FILE = path.join(process.cwd(), "data", "trends", "ui", "posts.json");

/** 보낸 UI 트렌드 글 (오래된 것 → 최신). 파일이 없으면 빈 배열 */
export function readUiPosts(file = UI_POSTS_FILE): UiPost[] {
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as UiPost[]) : [];
}
