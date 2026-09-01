import axios, { InternalAxiosRequestConfig } from "axios";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_MAX_AGE } from "./tokenConfig";

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

http.interceptors.request.use(async (config) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

async function refreshAccessToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) return null;

    // 서버는 refreshToken을 쿠키가 아닌 요청 body(TokenRefreshRequest)로 받는 구조
    const res = await axios.post<{ accessToken: string }>(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
      { refreshToken },
    );

    const newToken = res.data.accessToken;
    cookieStore.set("access_token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ACCESS_TOKEN_MAX_AGE,
      path: "/",
    });

    return newToken;
  } catch {
    return null;
  }
}

async function retryWithNewToken(config: RetryableConfig): Promise<boolean> {
  const newToken = await refreshAccessToken();
  if (!newToken) return false;
  config._retry = true;
  config.headers.Authorization = `Bearer ${newToken}`;
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
