import { api } from "./api";

export async function sendOtp(email: string): Promise<void> {
  await api.post("/api/auth/email/send-otp", { email });
}

export async function verifyOtp(
  email: string,
  code: string,
): Promise<{ verified: boolean; newUser: boolean }> {
  const res = await api.post<{ verified: boolean; newUser: boolean }>(
    "/api/auth/email/verify",
    { email, code },
  );
  return res.data;
}

export async function register(email: string, name: string): Promise<void> {
  await api.post("/api/auth/register", { email, name });
}
