"use server";

import { cookies } from "next/headers";
import { AuthResponse } from "@/types/auth";
import { ApiError, http } from "./http.server";
import { syncSchoolCookie } from "./school";
import { writeSessionCookies } from "./sessionCookies";

export async function sendOtp(email: string): Promise<void> {
  await http.post("/api/auth/email/send-otp", { email });
}

export type EmailSignInResult =
  | { status: "signedIn" }
  /** 가입되지 않은 이메일인데 이름을 받은 적이 없다 — 회원가입 흐름으로 보내야 한다 */
  | { status: "needSignup" }
  | { status: "invalidCode" }
  | { status: "failed" };

/**
 * OTP 검증부터 로그인/회원가입, 세션 쿠키 저장까지 서버에서 끝낸다.
 *
 * 예전엔 클라이언트가 login/register로 받은 토큰을 다시 saveLogin(email, uuid, token…)
 * Server Action에 넘겨 저장했다. 그러면 토큰이 브라우저 JS에 노출되고, 호출자가 준 임의의
 * 토큰·uuid·이메일 조합이 그대로 세션이 될 수 있었다. 이제 세션은 이 함수 안에서
 * 백엔드 응답으로만 만들어지고, 클라이언트는 결과 상태만 받는다.
 *
 * @param name 회원가입 흐름에서 받은 이름. 신규 이메일인데 이름이 없으면 needSignup.
 */
export async function signInWithEmailOtp(
  email: string,
  code: string,
  name?: string,
): Promise<EmailSignInResult> {
  let verified: { data: { verified: boolean; newUser: boolean } };
  try {
    verified = await http.post("/api/auth/email/verify", { email, code });
  } catch (error) {
    console.error("[auth] OTP 검증 실패:", error);
    // 백엔드는 틀린/만료된 코드, 시도 횟수 초과를 400으로 거절한다
    return error instanceof ApiError && error.status === 400
      ? { status: "invalidCode" }
      : { status: "failed" };
  }
  if (!verified.data.verified) return { status: "invalidCode" };

  try {
    let auth: AuthResponse;
    if (verified.data.newUser) {
      const trimmedName = name?.trim();
      if (!trimmedName) return { status: "needSignup" };
      auth = (
        await http.post<AuthResponse>("/api/auth/register", {
          email,
          name: trimmedName,
        })
      ).data;
    } else {
      auth = (await http.post<AuthResponse>("/api/auth/login", { email, code }))
        .data;
    }

    writeSessionCookies(await cookies(), {
      email,
      uuid: auth.uuid,
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
    });
    await syncSchoolNameQuietly();
    return { status: "signedIn" };
  } catch (error) {
    console.error("[auth] 로그인/회원가입 실패:", error);
    return { status: "failed" };
  }
}

/**
 * 헤더에 "PoFol | 강남대"를 띄우기 위한 학교명 쿠키를 심는다.
 *
 * 페이지마다 백엔드를 왕복하지 않으려고 로그인 시점에 한 번만 조회한다.
 * 학교 조회가 실패해도 로그인 자체는 성공시켜야 하므로 삼킨다.
 */
async function syncSchoolNameQuietly() {
  try {
    await syncSchoolCookie();
  } catch (error) {
    console.error("school cookie sync failed:", error);
  }
}

export async function logout(refreshToken: string): Promise<void> {
  await http.post("/api/auth/logout", {
    refreshToken,
  });
}
