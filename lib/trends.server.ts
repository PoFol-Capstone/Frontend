import fs from "node:fs";
import path from "node:path";
import type { GithubTrendSnapshot } from "@/lib/trends";

export const TRENDS_DIR = path.join(process.cwd(), "data", "trends", "github");

/** 저장된 월별 스냅샷 — 오래된 것부터. 폴더가 없으면 빈 배열 */
export function readSnapshots(dir = TRENDS_DIR): GithubTrendSnapshot[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /^\d{4}-\d{2}\.json$/.test(f))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as GithubTrendSnapshot);
}
