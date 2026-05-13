"use server";

import { AuthResponse } from "@/types/auth";
import { http } from "./http";

export async function sendOtp(email: string): Promise<void> {
  await http.post("/api/auth/email/send-otp", { email });
}

export async function verifyOtp(
  email: string,
  code: string,
): Promise<{ verified: boolean; newUser: boolean }> {
  const res = await http.post<{ verified: boolean; newUser: boolean }>(
    "/api/auth/email/verify",
    { email, code },
  );

  return res.data;
}

export async function login(
  email: string,
  code: string,
): Promise<AuthResponse> {
  const res = await http.post<AuthResponse>("/api/auth/login", { email, code });
  return res.data;
}

export async function register(
  email: string,
  name: string,
): Promise<AuthResponse> {
  const res = await http.post<AuthResponse>("/api/auth/register", {
    email,
    name,
  });
  return res.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await http.post("/api/auth/logout", {
    refreshToken,
  });
}
