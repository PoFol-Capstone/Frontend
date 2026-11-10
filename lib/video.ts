/**
 * 데모 영상 공유 링크 → embed URL (유튜브 · 구글 드라이브만).
 *
 * 사용자가 붙여넣은 어떤 형식이든 id만 뽑아 고정된 embed 주소로 바꾼다. 백엔드
 * PostLinkValidator도 같은 두 형식만 받으므로, iframe에는 이 함수가 만든 주소만 들어간다.
 * 이미 embed 형식인 값(수정 화면에서 불러온 값)도 그대로 통과한다.
 */

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"]);
const YOUTUBE_PATH = /^\/(?:embed|shorts|live)\/([^/]+)/;
const DRIVE_PATH = /^\/file\/d\/([A-Za-z0-9_-]+)(?:\/|$)/;

const EMBED_URL =
  /^(?:https:\/\/www\.youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{11}|https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]+\/preview)$/;

function youtubeId(url: URL): string | null {
  if (url.hostname === "youtu.be") return url.pathname.slice(1).split("/")[0] || null;
  if (!YOUTUBE_HOSTS.has(url.hostname)) return null;
  if (url.pathname === "/watch") return url.searchParams.get("v");
  return YOUTUBE_PATH.exec(url.pathname)?.[1] ?? null;
}

export function toVideoEmbedUrl(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  const yt = youtubeId(url);
  if (yt && YOUTUBE_ID.test(yt)) return `https://www.youtube-nocookie.com/embed/${yt}`;

  if (url.hostname === "drive.google.com") {
    const id = DRIVE_PATH.exec(url.pathname)?.[1];
    if (id) return `https://drive.google.com/file/d/${id}/preview`;
  }
  return null;
}

/** 저장된 값이 렌더링해도 되는 embed URL인지 (상세 화면에서 한 번 더 확인) */
export function isVideoEmbedUrl(url: string): boolean {
  return EMBED_URL.test(url);
}
