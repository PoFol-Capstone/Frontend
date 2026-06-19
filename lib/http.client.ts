"use client";
import axios, { InternalAxiosRequestConfig } from "axios";

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// withCredentials: true — 브라우저가 httpOnly 쿠키(access_token, refresh_token)를 자동으로 요청에 포함
export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

async function refreshAccessToken(): Promise<boolean> {
  try {
    // 브라우저가 refresh_token 쿠키를 자동 전송 — body에 토큰을 담지 않아도 됨
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
      null,
      { withCredentials: true },
    );
    return true;
  } catch {
    return false;
  }
}

http.interceptors.response.use(
  async (response) => {
    const config = response.config as RetryableConfig;
    if (
      (response.status === 401 || response.status === 403) &&
      !config._retry &&
      (await refreshAccessToken())
    ) {
      config._retry = true;
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
      (await refreshAccessToken())
    ) {
      error.config._retry = true;
      return http(error.config);
    }
    return Promise.reject(error);
  },
);
