import { test } from "node:test";
import assert from "node:assert/strict";
import { previousMonth, share, summarize, type GithubTrendSnapshot } from "@/lib/trends";

test("previousMonth — 1월이면 작년 12월, 말일까지", () => {
  assert.deepEqual(previousMonth(new Date("2027-01-02T00:00:00Z")), {
    period: "2026-12",
    from: "2026-12-01",
    to: "2026-12-31",
  });
  assert.equal(previousMonth(new Date("2028-03-02T00:00:00Z")).to, "2028-02-29");
});

const snap = (period: string, ts: number, incomplete: string[] = []): GithubTrendSnapshot => ({
  period,
  collectedAt: "",
  source: "GitHub Search API",
  sourceUrl: "",
  globalNewRepos: [
    { language: "TypeScript", count: ts },
    { language: "Java", count: 100 },
  ],
  koreaUsers: [{ language: "Java", count: 10 }],
  incomplete,
});

test("share — 없는 언어 · 빈 목록은 0", () => {
  assert.equal(share([], "Go"), 0);
  assert.equal(share(snap("x", 300).globalNewRepos, "TypeScript"), 0.75);
});

test("summarize — 순위 · 비중 변화 · 미완료 경고", () => {
  const text = summarize(snap("2026-11", 300, ["q1"]), snap("2026-10", 100));
  assert.match(text, /1\. TypeScript — 300개 · 75\.0% \(\+25\.0%p\)/);
  assert.match(text, /2\. Java — 100개 · 25\.0% \(-25\.0%p\)/);
  assert.match(text, /⚠️.*q1/);
  assert.match(summarize(snap("2026-11", 300), null), /첫 수집/);
});

test("readSnapshots — 폴더 없으면 빈 배열, 월 파일만 오래된 순", async () => {
  const fs = await import("node:fs");
  const os = await import("node:os");
  const path = await import("node:path");
  const { readSnapshots } = await import("@/lib/trends.server");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trends-"));
  assert.deepEqual(readSnapshots(path.join(dir, "none")), []);
  fs.writeFileSync(path.join(dir, "2026-11.json"), JSON.stringify(snap("2026-11", 1)));
  fs.writeFileSync(path.join(dir, "2026-10.json"), JSON.stringify(snap("2026-10", 1)));
  fs.writeFileSync(path.join(dir, "notes.txt"), "x");
  assert.deepEqual(readSnapshots(dir).map((s) => s.period), ["2026-10", "2026-11"]);
});
