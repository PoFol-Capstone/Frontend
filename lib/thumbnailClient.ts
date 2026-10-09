import { AI_INPUT_LIMITS } from "./aiInput";
import { MAX_THUMBNAIL_BYTES, THUMBNAIL_EXTENSIONS } from "./uploadLimits";

/**
 * 썸네일 업로드·AI 생성 클라이언트 호출.
 *
 * 예전 작성 화면은 요청 전에 기존 URL부터 지우고 실패는 무시해서, 교체에 실패하면 원래
 * 이미지까지 사라졌고 빈 값이 임시 저장(draft)에도 들어갔다. 이제 실패 사유를 구분해 돌려주고,
 * replaceThumbnail은 성공했을 때만 URL을 바꾼다.
 */

export type ThumbnailFailure =
  | { reason: "tooLarge" }
  | { reason: "invalidType" }
  | { reason: "invalidInput" }
  | { reason: "rateLimited"; retryAfterSeconds: number | null }
  | { reason: "unauthorized" }
  | { reason: "failed" }
  | { reason: "network" };

export type ThumbnailResult = { ok: true; url: string } | ({ ok: false } & ThumbnailFailure);

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** 서버로 보내기 전에 형식·크기를 확인한다 (서버도 같은 한도로 다시 검사한다) */
export function checkThumbnailFile(file: { type: string; size: number }): ThumbnailFailure | null {
  if (!THUMBNAIL_EXTENSIONS[file.type]) return { reason: "invalidType" };
  if (file.size > MAX_THUMBNAIL_BYTES) return { reason: "tooLarge" };
  return null;
}

async function toResult(
  request: () => Promise<Response>,
  badRequest: "invalidType" | "invalidInput",
): Promise<ThumbnailResult> {
  let res: Response;
  try {
    res = await request();
  } catch {
    return { ok: false, reason: "network" };
  }

  if (res.ok) {
    const data = (await res.json().catch(() => null)) as { url?: unknown } | null;
    return typeof data?.url === "string" && data.url
      ? { ok: true, url: data.url }
      : { ok: false, reason: "failed" };
  }

  switch (res.status) {
    case 400:
      return { ok: false, reason: badRequest };
    case 401:
      return { ok: false, reason: "unauthorized" };
    case 413:
      return { ok: false, reason: "tooLarge" };
    case 429: {
      const retryAfter = Number(res.headers.get("Retry-After"));
      return {
        ok: false,
        reason: "rateLimited",
        retryAfterSeconds: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
      };
    }
    default:
      return { ok: false, reason: "failed" };
  }
}

export async function uploadThumbnailFile(
  file: File,
  fetchImpl: FetchLike = fetch,
): Promise<ThumbnailResult> {
  const invalid = checkThumbnailFile(file);
  if (invalid) return { ok: false, ...invalid };

  const formData = new FormData();
  formData.append("file", file);
  return toResult(
    () => fetchImpl("/api/upload/thumbnail", { method: "POST", body: formData }),
    "invalidType",
  );
}

export async function requestAiThumbnail(
  info: {
    projectName: string;
    techStack: string[];
    projectDescription?: string;
    mainFeatures?: string;
  },
  fetchImpl: FetchLike = fetch,
): Promise<ThumbnailResult> {
  // 서버가 거절하는 길이는 미리 잘라 보낸다 (썸네일에는 앞부분만 쓰인다)
  const body = {
    projectName: info.projectName.trim(),
    techStack: info.techStack.slice(0, AI_INPUT_LIMITS.techStackItems),
    projectDescription: info.projectDescription?.slice(0, AI_INPUT_LIMITS.projectDescription),
    mainFeatures: info.mainFeatures?.slice(0, AI_INPUT_LIMITS.mainFeatures),
  };
  return toResult(
    () =>
      fetchImpl("/api/ai/thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    "invalidInput",
  );
}

/** 실패 사유 → `board.thumbnail` 메시지 키와 값 (한국어·영어 공통) */
export function thumbnailErrorMessage(
  failure: ThumbnailFailure,
): { key: string; values?: Record<string, number> } {
  switch (failure.reason) {
    case "tooLarge":
      return { key: "tooLarge", values: { max: MAX_THUMBNAIL_BYTES / (1024 * 1024) } };
    case "rateLimited":
      return failure.retryAfterSeconds
        ? { key: "rateLimited", values: { seconds: failure.retryAfterSeconds } }
        : { key: "rateLimitedLater" };
    default:
      return { key: failure.reason };
  }
}

/** 교체 시도. 성공했을 때만 새 URL로 바꾸고, 실패하면 기존 URL을 그대로 둔다. */
export async function replaceThumbnail(
  currentUrl: string,
  attempt: () => Promise<ThumbnailResult>,
): Promise<{ url: string; error: ThumbnailFailure | null }> {
  const result = await attempt();
  if (result.ok) return { url: result.url, error: null };
  return { url: currentUrl, error: result };
}
