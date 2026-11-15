/**
 * 디자인 매체 RSS/Atom에서 최근 7일 새 글을 골라 디스코드로 보내고 data/trends/ui/posts.json에 쌓는다.
 * posts.json이 곧 "이미 보낸 글" 기록이라 같은 글은 두 번 가지 않는다. 트렌드 페이지가 이 파일을 보여준다.
 *
 * 실행: node --import ./tests/setup/register.mjs scripts/collect-ui-trends.ts
 * 환경 변수:
 *  - DISCORD_WEBHOOK_URL — 없으면 알림만 건너뛰고 posts.json은 갱신 (값은 절대 로그에 남기지 않는다)
 *  - DRY_RUN=1 — 보낼 embed를 출력만, 디스코드 · 파일 모두 건드리지 않음
 */
import fs from "node:fs";
import path from "node:path";
import Parser from "rss-parser";
import { UI_FEEDS, buildEmbed, pickNew, trimKept, type UiPost } from "@/lib/uiTrends";
import { UI_POSTS_FILE, readUiPosts } from "@/lib/trends.server";

const DRY_RUN = process.env.DRY_RUN === "1";
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const parser = new Parser();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 다운로드는 내장 fetch로 — rss-parser의 parseURL은 소켓 · 타이머를 열어 둔 채 남겨 프로세스가 끝나지 않는다
async function fetchFeed(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": "pofol-ui-trends" }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parser.parseString(await res.text());
}

/** 피드는 병렬로. 하나가 실패해도 로그만 남기고 나머지는 계속 */
async function fetchAll(): Promise<Partial<UiPost>[]> {
  const results = await Promise.allSettled(UI_FEEDS.map((f) => fetchFeed(f.url)));
  return results.flatMap((result, i) => {
    const source = UI_FEEDS[i].name;
    if (result.status === "rejected") {
      console.error(`[feed:fail] ${source} — ${(result.reason as Error).message}`);
      return [];
    }
    console.log(`[feed:ok] ${source} — ${result.value.items.length}개`);
    return result.value.items.map((it) => ({
      source,
      title: it.title,
      link: it.link,
      date: it.isoDate ?? it.pubDate,
      // Medium(UX Collective)은 본문을 content:encoded에만 넣는다
      summary: it.contentSnippet || (it["content:encodedSnippet"] as string | undefined) || it.summary,
    }));
  });
}

/** embed 하나 전송. 429면 디스코드가 알려준 retry_after(초)만큼 기다렸다 재시도 */
async function send(post: UiPost, attempt = 1): Promise<void> {
  const res = await fetch(WEBHOOK_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [buildEmbed(post)] }),
  });
  if (res.status === 429 && attempt <= 5) {
    const body = (await res.json().catch(() => ({}))) as { retry_after?: number };
    const seconds = Number(body.retry_after ?? res.headers.get("retry-after") ?? 1);
    console.log(`[discord] 429 — ${seconds}초 뒤 재시도`);
    await sleep(seconds * 1000);
    return send(post, attempt + 1);
  }
  // 상태 코드만 — 에러에 웹훅 URL이 섞이지 않게
  if (!res.ok) throw new Error(`디스코드 웹훅 응답 ${res.status}`);
}

const kept = readUiPosts();
const fresh = pickNew(await fetchAll(), kept.map((p) => p.link));

if (fresh.length === 0) {
  console.log("새 글 없음 — 아무것도 보내지 않음");
} else if (DRY_RUN) {
  for (const post of fresh) console.log(JSON.stringify(buildEmbed(post), null, 2));
  console.log(`[dry-run] ${fresh.length}개를 보낼 예정`);
} else {
  if (!WEBHOOK_URL) console.log("DISCORD_WEBHOOK_URL 없음 — 알림은 건너뛰고 기록만 갱신");
  try {
    for (const post of fresh) {
      if (WEBHOOK_URL) await send(post);
      kept.push(post); // 보낼 때마다 바로 기록 — 중간에 실패해도 보낸 글은 다음에 다시 안 간다
    }
  } finally {
    fs.mkdirSync(path.dirname(UI_POSTS_FILE), { recursive: true });
    fs.writeFileSync(UI_POSTS_FILE, JSON.stringify(trimKept(kept), null, 2) + "\n");
  }
  console.log(`${fresh.length}개 ${WEBHOOK_URL ? "전송" : "기록"}`);
}
