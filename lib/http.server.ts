import axios, { InternalAxiosRequestConfig } from "axios";
import { cookies } from "next/headers";
import { refreshAccessToken } from "./backendAuth";
import { isJwtExpired } from "./jwt";

declare module "axios" {
  interface AxiosRequestConfig {
    /**
     * 공개(permitAll) API지만 로그인한 사용자 기준으로 결과가 달라지는 요청
     * (예: 내 북마크, 내 학교 게시물). 토큰 없이 보내면 백엔드가 익명 200·빈 목록을 돌려줘
     * "결과 없음"처럼 보이므로, 토큰을 확보하지 못하면 보내지 않고 401로 실패시킨다.
     */
    requireAuth?: boolean;
  }
}

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export class ApiError extends Error {
  status?: number;
  cause?: unknown;

  constructor(status: number | undefined, message: string, cause?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.cause = cause;
  }
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    // 백엔드는 에러 메시지를 두 가지 형태로 보낸다:
    //   - GlobalExceptionHandler(400 등): { "error": "이미 팔로우한 유저입니다" }
    //   - Spring 기본 응답:              { "message": "..." }
    // 예전엔 message만 읽어서 GlobalExceptionHandler가 붙여준 메시지가 전부 유실됐다.
    const data = error.response?.data as
      | { message?: unknown; error?: unknown }
      | undefined;
    const serverMessage =
      typeof data?.message === "string" && data.message
        ? data.message
        : typeof data?.error === "string" && data.error
          ? data.error
          : undefined;
    return new ApiError(
      status,
      serverMessage ?? error.message ?? "요청 처리 중 오류가 발생했습니다.",
      error,
    );
  }
  return new ApiError(
    undefined,
    error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
    error,
  );
}

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

/**
 * 이 요청에 쓸 access token을 구한다. 쿠키는 읽기만 한다.
 *
 * 쿠키 저장은 쓸 수 있는 경계에서만 한다 — 페이지·Server Action 요청은 proxy.ts가 렌더 전에
 * 갱신·저장해 두고, 비용이 드는 Route Handler는 lib/verifiedUser.ts가 응답 쿠키로 저장한다.
 * Server Component 렌더 중 cookies().set()은 Next가 거절하므로(예전엔 그 예외가 삼켜져
 * 갱신 자체가 실패 처리됐다), 여기서 갱신한 토큰은 이번 요청에만 메모리로 쓴다.
 */
async function resolveAccessToken(): Promise<
  | { kind: "token"; token: string }
  | { kind: "none" }
  | { kind: "unavailable" }
> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (accessToken && !isJwtExpired(accessToken)) {
    return { kind: "token", token: accessToken };
  }

  const refreshToken = cookieStore.get("refresh_token")?.value;
  if (!refreshToken) return { kind: "none" };

  const result = await refreshAccessToken(refreshToken);
  if (result.kind === "ok") return { kind: "token", token: result.accessToken };
  return result.kind === "unavailable" ? { kind: "unavailable" } : { kind: "none" };
}

http.interceptors.request.use(async (config) => {
  // 재시도 요청에는 retryWithNewToken이 새 토큰을 이미 넣었다 — 쿠키의 거절된 토큰으로 덮어쓰지 않는다
  if ((config as RetryableConfig)._retry) return config;

  const resolved = await resolveAccessToken();

  if (resolved.kind === "token") {
    config.headers.Authorization = `Bearer ${resolved.token}`;
  } else if (config.requireAuth) {
    throw resolved.kind === "unavailable"
      ? new ApiError(503, "인증 서버에 연결할 수 없습니다.")
      : new ApiError(401, "로그인이 필요합니다.");
  }

  return config;
});

/** 토큰이 거절됐을 때(폐기·위조 등 만료 전 무효) refresh token으로 한 번만 재발급해 재시도한다 */
async function retryWithNewToken(config: RetryableConfig): Promise<boolean> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;
  if (!refreshToken) return false;

  const result = await refreshAccessToken(refreshToken);
  // invalid면 원래의 401/403을 그대로 돌려줘서 호출부가 재로그인 흐름을 타게 한다
  if (result.kind !== "ok") return false;

  config._retry = true;
  config.headers.Authorization = `Bearer ${result.accessToken}`;
  return true;
}

// validateStatus: () => true 인 요청은 4xx도 success 인터셉터로 오므로 여기서 처리
http.interceptors.response.use(
  async (response) => {
    const config = response.config as RetryableConfig;
    if (
      (response.status === 401 || response.status === 403) &&
      !config._retry &&
      (await retryWithNewToken(config))
    ) {
      return http(config);
    }
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    if (
      (status === 401 || status === 403) &&
      !error.config?._retry &&
      error.config &&
      (await retryWithNewToken(error.config))
    ) {
      return http(error.config);
    }

    return Promise.reject(toApiError(error));
  },
);

/** 세션이 더 이상 유효하지 않아 재로그인이 필요한 실패인지 */
export function isSessionRejected(error: unknown): boolean {
  return (
    error instanceof ApiError && (error.status === 401 || error.status === 403)
  );
}
