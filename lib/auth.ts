import { RefreshResponse } from "@/app/types/auth";
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

export async function register(email: string, name: string): Promise<void> {
  await http.post("/api/auth/register", { email, name });
}

export async function logout(): Promise<void> {
  await http.post("/api/auth/logout");
}

export async function refresh(refreshToken: string): Promise<string> {
  const res = await http.post<RefreshResponse>("/api/auth/refresh", {
    refreshToken,
  });

  return res.data.accessToken;
}
