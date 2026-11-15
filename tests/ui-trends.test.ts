import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_AGE_DAYS, MAX_KEPT, MAX_PER_RUN, buildEmbed, latestPosts, pickNew, trimKept, type UiPost } from "@/lib/uiTrends";

const NOW = Date.parse("2026-01-31T00:00:00Z");
const HOUR = 3_600_000;

// n시간 전에 올라온 글 (n이 클수록 오래됨)
const post = (n: number, extra: Partial<UiPost> = {}): Partial<UiPost> => ({
  source: "Test Feed",
  title: `Post ${n}`,
  link: `https://example.com/${n}`,
  date: new Date(NOW - n * HOUR).toISOString(),
  summary: `Summary ${n}`,
  ...extra,
});

test("pickNew — 이미 보낸 글 제외, 오래된 것 → 최신 순", () => {
  const result = pickNew([post(1), post(2), post(3)], ["https://example.com/2"], NOW);
  assert.deepEqual(result.map((p) => p.title), ["Post 3", "Post 1"]);
});

test("pickNew — 두 피드에 같은 URL이면 한 번만", () => {
  assert.equal(pickNew([post(1), post(1, { source: "Other" })], [], NOW).length, 1);
});

test("pickNew — 최신 10개만", () => {
  const result = pickNew(Array.from({ length: 15 }, (_, i) => post(i + 1)), [], NOW);
  assert.equal(result.length, MAX_PER_RUN);
  assert.equal(result[0].title, "Post 10");
  assert.equal(result.at(-1)!.title, "Post 1");
});

test("pickNew — 모두 보낸 글이면 빈 배열", () => {
  assert.deepEqual(pickNew([post(1)], ["https://example.com/1"], NOW), []);
});

test(`pickNew — ${MAX_AGE_DAYS}일 지난 글 · 날짜 없는 글 제외`, () => {
  const items = [post(MAX_AGE_DAYS * 24 + 1), post(1, { date: undefined }), post(2, { date: "not a date" }), post(3)];
  assert.deepEqual(pickNew(items, [], NOW).map((p) => p.title), ["Post 3"]);
});

test("pickNew — 링크가 없거나 http(s)가 아니면 제외", () => {
  const items = [post(1, { link: undefined }), post(2, { link: "javascript:alert(1)" }), post(3)];
  assert.deepEqual(pickNew(items, [], NOW).map((p) => p.title), ["Post 3"]);
});

test("pickNew — 공백 정리 · 디스코드 길이 제한(제목 256, 요약 200) · 빈 제목", () => {
  const [long] = pickNew([post(1, { title: "T".repeat(300), summary: `a\n\n   b ${"x".repeat(300)}` })], [], NOW);
  assert.equal(long.title.length, 256);
  assert.ok(long.title.endsWith("…"));
  assert.ok(long.summary.startsWith("a b"));
  assert.ok(long.summary.length <= 200);
  assert.equal(pickNew([post(1, { title: "  " })], [], NOW)[0].title, "(untitled)");
});

test("trimKept — 500개 넘으면 오래된 것부터 버림, 짧으면 그대로", () => {
  const list = Array.from({ length: 520 }, (_, i) => i);
  const trimmed = trimKept(list);
  assert.equal(trimmed.length, MAX_KEPT);
  assert.equal(trimmed[0], 20);
  assert.equal(trimmed.at(-1), 519);
  assert.deepEqual(trimKept([1, 2]), [1, 2]);
});

test("buildEmbed — 제목 · 링크 · 출처 · 날짜, 빈 요약은 필드째 생략", () => {
  const [p] = pickNew([post(5)], [], NOW);
  const embed = buildEmbed(p);
  assert.equal(embed.title, "Post 5");
  assert.equal(embed.url, "https://example.com/5");
  assert.equal(embed.footer.text, "Test Feed");
  assert.equal(embed.timestamp, "2026-01-30T19:00:00.000Z");
  assert.equal(embed.description, "Summary 5");
  assert.equal(buildEmbed({ ...p, summary: "" }).description, undefined);
});

test("latestPosts — 최신 순 n개", () => {
  const posts = pickNew([post(3), post(1), post(2)], [], NOW);
  assert.deepEqual(latestPosts(posts, 2).map((p) => p.title), ["Post 1", "Post 2"]);
});

test("readUiPosts — 파일 없으면 빈 배열", async () => {
  const { readUiPosts } = await import("@/lib/trends.server");
  assert.deepEqual(readUiPosts("/no/such/posts.json"), []);
});
