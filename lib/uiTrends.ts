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
  /** AI 번역 — 실패하면 비어 있고 다음 실행 때 다시 시도 */
  titleKo?: string;
  summaryKo?: string;
  /** 글의 og:image. 찾아봤는데 없으면 "" (다시 찾지 않음), 아직 안 찾았으면 undefined */
  image?: string;
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
      // 피드에서 찾은 이미지만 미리 채운다. 없으면 undefined → 수집 스크립트가 og:image를 찾아본다
      image: safeImageUrl(item.image, link) || undefined,
    });
  }
  return fresh.sort((a, b) => time(b) - time(a)).slice(0, MAX_PER_RUN).reverse();
}

/** 오래된 것부터 버리고 최근 max개만 */
export const trimKept = <T>(list: T[], max = MAX_KEPT) => list.slice(-max);

/** 디스코드 embed — 제목(링크), 요약, 대표 이미지, 푸터에 출처 + 날짜. 번역이 있으면 한국어로 */
export function buildEmbed(post: UiPost) {
  return {
    title: post.titleKo || post.title,
    url: post.link,
    description: post.summaryKo || post.summary || undefined, // 빈 문자열은 디스코드가 거부
    image: post.image ? { url: post.image } : undefined,
    footer: { text: post.source },
    timestamp: post.date,
    color: 0x7c5cff,
  };
}

/** 번역이나 이미지 찾기가 아직 안 된 글 — 다음 실행 때 다시 채운다 */
export const needsEnrich = (p: UiPost) => !p.titleKo || p.image === undefined;

/** 외부에서 온 이미지 주소 → 절대 http(s) URL, 아니면 "" */
export function safeImageUrl(raw: string | undefined, base: string): string {
  if (!raw) return "";
  try {
    const url = new URL(raw.replace(/&amp;/g, "&"), base);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}

/** 글 HTML에서 og:image(없으면 twitter:image) — 속성 순서 무관 */
export function extractOgImage(html: string, pageUrl: string): string {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (!/(?:property|name)=["'](?:og:image|twitter:image)["']/i.test(tag)) continue;
    const url = safeImageUrl(tag.match(/content=["']([^"']+)["']/i)?.[1], pageUrl);
    if (url) return url;
  }
  return "";
}

/** RSS 본문의 첫 <img> — Medium(UX Collective)은 페이지 요청을 막지만 본문에 대표 이미지를 싣는다 */
export const firstImage = (html: string, pageUrl: string) =>
  safeImageUrl(html.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1], pageUrl);

/**
 * 번역 응답 {items:[{id,title,summary}]}을 글에 반영. 모델 출력도 외부 입력이라
 * id 범위 · 문자열 여부 · 길이를 확인하고, 잘못된 항목은 건너뛴다 (그 글은 다음 실행 때 다시 번역).
 */
export function applyTranslations(posts: UiPost[], response: unknown): number {
  const items = (response as { items?: unknown })?.items;
  if (!Array.isArray(items)) return 0;
  let applied = 0;
  for (const item of items as { id?: unknown; title?: unknown; summary?: unknown }[]) {
    const post = typeof item?.id === "number" ? posts[item.id] : undefined;
    if (!post || typeof item.title !== "string" || !item.title.trim()) continue;
    post.titleKo = clip(item.title.trim(), 256);
    post.summaryKo = typeof item.summary === "string" ? clip(item.summary.trim(), 200) : "";
    applied++;
  }
  return applied;
}

/** 페이지용 — 최신 글 n개, 최신 순 */
export const latestPosts = (posts: UiPost[], n = 12) => [...posts].sort((a, b) => time(b) - time(a)).slice(0, n);
