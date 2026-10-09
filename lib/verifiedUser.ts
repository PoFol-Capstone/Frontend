import { NextResponse, type NextRequest } from "next/server";
import { checkAccessToken, refreshAccessToken } from "./backendAuth";
import { isJwtExpired } from "./jwt";
import { writeRefreshedAccessToken } from "./sessionCookies";

/**
 * 비용이 드는 Route Handler(AI 요약·썸네일, 업로드)의 인증.
 *
 * 예전엔 서명되지 않은 `uuid` 쿠키가 있는지만 보고 같은 값을 호출 제한 키로 썼다.
 * 그래서 토큰 없이 uuid 쿠키만 넣어도 외부 호출까지 갔고, uuid를 바꾸면 제한도 풀렸다.
 * 이제는 access token을 백엔드에 제시해 인증을 확인하고, 확인된 토큰의 uuid만 쓴다.
 * `uuid` 쿠키는 아예 읽지 않는다.
 *
 * Route Handler는 proxy.ts를 거치지 않으므로(matcher가 /api 제외) access token이 없거나
 * 만료됐으면 여기서 refresh token으로 갱신하고, 응답에 새 쿠키를 실어 보낸다.
 */

export type VerifiedUser = {
  uuid: string;
  /** 이 요청에서 갱신한 access token. 응답 쿠키로 저장해야 한다. */
  refreshed: { accessToken: string; uuid: string | null } | null;
};

export type VerifyOutcome =
  | { ok: true; user: VerifiedUser }
  | { ok: false; response: NextResponse };

const unauthorized = () =>
  NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

const unavailable = () =>
  NextResponse.json(
    { error: "인증 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요." },
    { status: 503 },
  );

export async function requireVerifiedUser(
  req: NextRequest,
): Promise<VerifyOutcome> {
  const accessToken = req.cookies.get("access_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;

  if (accessToken && !isJwtExpired(accessToken)) {
    const check = await checkAccessToken(accessToken);
    if (check.kind === "ok") {
      return { ok: true, user: { uuid: check.uuid, refreshed: null } };
    }
    if (check.kind === "unavailable") return { ok: false, response: unavailable() };
    // rejected — 위조·폐기된 토큰. refresh token이 있으면 아래에서 한 번만 재발급을 시도한다
  }

  if (!refreshToken) return { ok: false, response: unauthorized() };

  const refreshed = await refreshAccessToken(refreshToken);
  if (refreshed.kind === "unavailable") return { ok: false, response: unavailable() };
  if (refreshed.kind === "invalid") return { ok: false, response: unauthorized() };

  const check = await checkAccessToken(refreshed.accessToken);
  if (check.kind === "unavailable") return { ok: false, response: unavailable() };
  if (check.kind === "rejected") return { ok: false, response: unauthorized() };

  return {
    ok: true,
    user: {
      uuid: check.uuid,
      refreshed: { accessToken: refreshed.accessToken, uuid: refreshed.uuid },
    },
  };
}

/** 이 요청에서 access token을 갱신했다면 응답 쿠키로 저장해 다음 요청이 다시 갱신하지 않게 한다 */
export function withRefreshedSession<T extends NextResponse>(
  response: T,
  user: VerifiedUser,
): T {
  if (user.refreshed) {
    writeRefreshedAccessToken(
      response.cookies,
      user.refreshed.accessToken,
      user.refreshed.uuid,
    );
  }
  return response;
}
