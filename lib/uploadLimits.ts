/**
 * 썸네일 업로드 제한 — 클라이언트 사전 검사와 /api/upload/thumbnail이 같은 값을 쓴다.
 *
 * Vercel Functions는 요청 본문을 4.5 MB(4,500,000 bytes)까지만 받는다. 파일은 multipart
 * 경계·헤더와 함께 실리므로 파일 한도를 4 MiB로 두고 요청 전체에는 여유분을 더해 검사한다.
 * 5 MiB 이상을 지원해야 한다면 함수 본문을 거치지 않는 인증된 직접 업로드(클라이언트
 * 업로드 토큰 발급) 계약이 필요하다.
 */
export const MAX_THUMBNAIL_BYTES = 4 * 1024 * 1024;

/** multipart 오버헤드 허용분을 포함한 요청 본문 상한 (4.5 MB 미만) */
export const MAX_THUMBNAIL_REQUEST_BYTES = MAX_THUMBNAIL_BYTES + 64 * 1024;

export const MAX_THUMBNAIL_MB = MAX_THUMBNAIL_BYTES / (1024 * 1024);

/** 허용 MIME → 저장 확장자. 사용자 파일명의 확장자는 신뢰하지 않는다. */
export const THUMBNAIL_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const THUMBNAIL_ACCEPT = Object.keys(THUMBNAIL_EXTENSIONS).join(",");
