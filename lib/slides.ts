/**
 * 구글 슬라이드 공유 링크 → embed URL.
 *
 * `docs.google.com/presentation/d/{id}/...` 에서 id만 뽑아 `/embed`로 바꾼다. 백엔드
 * PostDocumentValidator도 같은 형식만 받으므로, iframe에는 이 함수가 만든 주소만 들어간다.
 * "웹에 게시"한 링크(`/d/e/{publishedId}/pub`)는 공유 링크와 id 체계가 달라 지원하지 않는다.
 */

const SLIDES_PATH = /^\/presentation\/d\/([A-Za-z0-9_-]+)(?:\/|$)/;
const EMBED_URL = /^https:\/\/docs\.google\.com\/presentation\/d\/[A-Za-z0-9_-]+\/embed$/;

export function toSlidesEmbedUrl(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.hostname !== "docs.google.com") return null;
  const match = SLIDES_PATH.exec(url.pathname);
  if (!match || match[1] === "e") return null;
  return `https://docs.google.com/presentation/d/${match[1]}/embed`;
}

/** 저장된 값이 렌더링해도 되는 embed URL인지 (뷰어에서 한 번 더 확인) */
export function isSlidesEmbedUrl(url: string): boolean {
  return EMBED_URL.test(url);
}
