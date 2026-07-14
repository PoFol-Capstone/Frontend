import axios, { InternalAxiosRequestConfig } from "axios";
import { cookies } from "next/headers";

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
    const serverMessage = (error.response?.data as { message?: string } | undefined)
      ?.message;
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

    // refresh_token을 body 대신 Cookie 헤더로 전달 — 서버가 쿠키에서 직접 읽는 구조
    const res = await axios.post<{ accessToken: string }>(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
      null,
      { headers: { Cookie: `refresh_token=${refreshToken}` } },
    );

    const newToken = res.data.accessToken;
    cookieStore.set("access_token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60,
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

    if (process.env.NODE_ENV !== "production") {
      console.error(
        "[http] request failed:",
        error.config?.method,
        error.config?.url,
        error,
      );
    }

    return Promise.reject(toApiError(error));
  },
);
