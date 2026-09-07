"use server";

import { cookies } from "next/headers";
import { requireSessionUuid } from "./authGuard";
import { ApiError, http } from "./http.server";
import { REFRESH_TOKEN_MAX_AGE } from "./tokenConfig";
import type { ActionResult } from "@/types/action";
import type { SchoolNames, SchoolStatus } from "@/types/school";

/**
 * 학교 인증 관련 서버 함수 + `school` 쿠키 소유.
 *
 * 쿠키 읽기/쓰기를 session.ts에 두지 않고 여기서 cookies()를 직접 쓰는 이유:
 * session.ts가 로그인 직후 학교 상태를 조회해야 하므로 school.ts를 import한다.
 * 쿠키 헬퍼가 session.ts에 있으면 school.ts ↔ session.ts 순환 import가 된다.
 * 의존 방향은 session.ts → school.ts 한 방향만 유지한다.
 */

// "use server" 파일은 async 함수만 export할 수 있으므로 상수는 모듈 로컬로 둔다
const SCHOOL_COOKIE = "school";

const SCHOOL_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: REFRESH_TOKEN_MAX_AGE,
  path: "/",
};

// ---------------------------------------------------------------- HTTP

export async function fetchSchoolStatus(): Promise<SchoolStatus> {
  await requireSessionUuid();
  const res = await http.get<SchoolStatus>("/api/auth/school/status");
  return res.data;
}

/** 학교 이메일로 인증 코드 발송. 성공 시 학교명을 함께 돌려준다. */
export async function sendSchoolOtp(
  schoolEmail: string,
): Promise<ActionResult & { schoolNameKo?: string }> {
  try {
    await requireSessionUuid();
    const res = await http.post<{ schoolNameKo: string }>(
      "/api/auth/school/send-otp",
      { schoolEmail },
    );
    return { ok: true, schoolNameKo: res.data.schoolNameKo };
  } catch (error) {
    return { ok: false, message: toMessage(error) };
  }
}

/** 인증 코드 검증. 성공하면 헤더용 `school` 쿠키까지 갱신한다. */
export async function verifySchoolOtp(
  schoolEmail: string,
  otpCode: string,
): Promise<ActionResult & { schoolNameKo?: string }> {
  try {
    await requireSessionUuid();
    const res = await http.post<{ schoolName: string; schoolNameKo: string }>(
      "/api/auth/school/verify",
      { schoolEmail, otpCode },
    );

    await writeSchoolCookie({
      ko: res.data.schoolNameKo,
      en: res.data.schoolName,
    });

    return { ok: true, schoolNameKo: res.data.schoolNameKo };
  } catch (error) {
    return { ok: false, message: toMessage(error) };
  }
}

// ---------------------------------------------------------------- 쿠키

/**
 * 백엔드에서 학교 인증 상태를 읽어 `school` 쿠키를 맞춘다.
 *
 * 로그인 직후 호출된다. Next.js 쿠키 스토어는 같은 요청 안에서 read-your-writes라서
 * saveLogin이 access_token을 심은 직후에 호출해도 http 인터셉터가 새 토큰을 집어간다.
 */
export async function syncSchoolCookie(): Promise<void> {
  const status = await fetchSchoolStatus();

  if (!status.verified || !status.schoolNameKo || !status.schoolName) {
    await clearSchoolCookie();
    return;
  }

  await writeSchoolCookie({ ko: status.schoolNameKo, en: status.schoolName });
}

export async function getSchoolCookie(): Promise<SchoolNames | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SCHOOL_COOKIE)?.value;
  if (!raw) return null;

  // 쿠키 값은 사용자가 조작할 수 있고 저장 형식이 바뀔 수도 있다 —
  // 깨진 값 때문에 헤더 전체가 터지지 않도록 조용히 null로 떨어뜨린다.
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof parsed?.ko !== "string" || typeof parsed?.en !== "string") {
      return null;
    }
    return { ko: parsed.ko, en: parsed.en };
  } catch {
    return null;
  }
}

export async function clearSchoolCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SCHOOL_COOKIE);
}

async function writeSchoolCookie(names: SchoolNames): Promise<void> {
  const cookieStore = await cookies();
  // 한글은 쿠키 값으로 그대로 쓸 수 없다(RFC 6265 cookie-octet 범위 밖).
  // base64url은 [A-Za-z0-9_-]뿐이라 중간에 어떤 인코딩 계층이 끼어도 안전하다.
  const encoded = Buffer.from(JSON.stringify(names), "utf8").toString(
    "base64url",
  );
  cookieStore.set(SCHOOL_COOKIE, encoded, SCHOOL_COOKIE_OPTIONS);
}

function toMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "학교 인증 처리 중 오류가 발생했습니다.";
}
