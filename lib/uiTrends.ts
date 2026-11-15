/**
 * UI/UX 디자인 트렌드 — scripts/collect-ui-trends.ts가 매일 디자인 매체 RSS를 읽어
 * 새 글을 디스코드로 보내고 data/trends/ui/posts.json에 쌓는다. 트렌드 페이지는 이 파일을 보여준다.
 * 여기는 네트워크 · 파일 없는 순수 함수만 (테스트 대상).
 */

export const UI_FEEDS = [
  { name: "Nielsen Norman Group", url: "https://www.nngroup.com/feed/rss/" },
  { name: "Smashing Magazine", url: "https://www.smashingmagazine.com/feed/" },
  { name: "UX Collective", url: "https://uxdesign.cc/feed" },
  { name: "Figma Blog", url: "https://www.figma.com/blog/feed/atom.xml" },
  { name: "web.dev", url: "https://web.dev/feed.xml" },
] as const;

export type UiPost = {
  source: string;
  title: string;
  link: string;
  date: string; // ISO
  summary: string;
};

export const MAX_PER_RUN = 10;
/** posts.json은 보낸 글 기록이자 중복 체크용 — 최근 500개만 남긴다 */
export const MAX_KEPT = 500;
// 후보는 최근 7일 글만. 후보 수가 MAX_KEPT보다 훨씬 작아서, 기록에서 잘려 나간 글이 다시 "새 글"이 되지 않는다
// (Figma 피드 하나에만 글이 ~800개). 첫 실행 때 몇 년 치가 쏟아지는 것도 막는다.
export const MAX_AGE_DAYS = 7;

const DAY_MS = 86_400_000;
const time = (p: { date?: string }) => new Date(p.date ?? "").getTime() || 0;
export const clip = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

/** 이미 보낸 글 · 피드 간 중복 · 7일 지난 글을 빼고 최신 10개. 오래된 것 → 최신 순 (디스코드 맨 아래가 최신) */
export function pickNew(items: Partial<UiPost>[], sentLinks: string[], now = Date.now()): UiPost[] {
  const cutoff = now - MAX_AGE_DAYS * DAY_MS;
  const seen = new Set(sentLinks);
  const fresh: UiPost[] = [];
  for (const item of items) {
    const link = item.link ?? "";
    // 피드 내용은 외부 입력 — http(s)가 아닌 링크는 디스코드도 거부하고 페이지에 걸면 위험하다
    if (!/^https?:\/\//.test(link) || seen.has(link)) continue;
    if (time(item) < cutoff) continue; // 날짜 없는 글도 빠진다 (영원히 "최근"이 될 수 있어서)
    seen.add(link);
    fresh.push({
      source: item.source ?? "",
      title: clip(item.title?.trim() || "(untitled)", 256),
      link,
      date: new Date(time(item)).toISOString(),
      summary: clip((item.summary ?? "").replace(/\s+/g, " ").trim(), 200),
    });
  }
  return fresh.sort((a, b) => time(b) - time(a)).slice(0, MAX_PER_RUN).reverse();
}

/** 오래된 것부터 버리고 최근 max개만 */
export const trimKept = <T>(list: T[], max = MAX_KEPT) => list.slice(-max);

/** 디스코드 embed — 제목(링크), 요약, 푸터에 출처 + 날짜 */
export function buildEmbed(post: UiPost) {
  return {
    title: post.title,
    url: post.link,
    description: post.summary || undefined, // 빈 문자열은 디스코드가 거부
    footer: { text: post.source },
    timestamp: post.date,
    color: 0x7c5cff,
  };
}

/** 페이지용 — 최신 글 n개, 최신 순 */
export const latestPosts = (posts: UiPost[], n = 12) => [...posts].sort((a, b) => time(b) - time(a)).slice(0, n);
