import axios, { InternalAxiosRequestConfig } from "axios";

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use(async (config) => {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) return null;

    const res = await axios.post<{ accessToken: string }>(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
      { refreshToken },
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
    if (
      error.response?.status === 401 &&
      !error.config?._retry &&
      error.config &&
      (await retryWithNewToken(error.config))
    ) {
      return http(error.config);
    }
    return Promise.reject(error);
  },
);
