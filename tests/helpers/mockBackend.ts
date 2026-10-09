import http from "node:http";
import type { AddressInfo } from "node:net";
import { randomUUID } from "node:crypto";

/**
 * 테스트용 가짜 백엔드. 실제 BE(176765a)의 인증 계약만 흉내 낸다.
 * - 발급한 access token만 유효 (서명 대신 발급 목록으로 판별), exp가 지나면 무효
 * - POST /api/auth/refresh: 등록된 refresh token이면 { accessToken, uuid }, 아니면 400
 * - GET /api/auth/school/status: 인증 필수(무효 토큰 403), 삭제된 유저면 400
 * - 그 밖의 경로는 테스트가 route()로 등록한다
 */

export type RecordedRequest = {
  method: string;
  path: string;
  query: URLSearchParams;
  authorization: string | undefined;
  body: unknown;
};

type Reply = { status: number; body?: unknown; headers?: Record<string, string> };
type Handler = (req: RecordedRequest, user: TestUser | null) => Reply | Promise<Reply>;

export type TestUser = { uuid: string; userId: number; email: string; deleted?: boolean };

function base64url(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

/** BE와 같은 클레임 구조(sub=email, uuid, userId, exp)의 JWT 모양 토큰. 서명은 가짜다. */
export function makeJwt(payload: Record<string, unknown>, signature = "test-signature") {
  return `${base64url({ alg: "HS256" })}.${base64url(payload)}.${signature}`;
}

export async function startMockBackend() {
  const requests: RecordedRequest[] = [];
  const routes = new Map<string, Handler>();
  const accessTokens = new Map<string, TestUser>();
  const refreshTokens = new Map<string, TestUser>();
  let down = false;

  const userForAuthorization = (authorization: string | undefined) => {
    if (!authorization?.startsWith("Bearer ")) return null;
    const token = authorization.slice("Bearer ".length);
    const user = accessTokens.get(token);
    if (!user) return null;
    const exp = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).exp;
    return exp * 1000 > Date.now() ? user : null;
  };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://backend.test");
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const text = Buffer.concat(chunks).toString();
    const recorded: RecordedRequest = {
      method: req.method ?? "GET",
      path: url.pathname,
      query: url.searchParams,
      authorization: req.headers.authorization,
      body: text ? JSON.parse(text) : undefined,
    };
    requests.push(recorded);

    const send = ({ status, body, headers }: Reply) => {
      res.writeHead(status, { "Content-Type": "application/json", ...headers });
      res.end(body === undefined ? "" : JSON.stringify(body));
    };

    if (down) return send({ status: 503, body: { error: "down" } });

    const user = userForAuthorization(recorded.authorization);

    if (recorded.method === "POST" && recorded.path === "/api/auth/refresh") {
      const refreshToken = (recorded.body as { refreshToken?: string })?.refreshToken ?? "";
      const owner = refreshTokens.get(refreshToken);
      if (!owner || owner.deleted) {
        return send({ status: 400, body: { error: "유효하지 않은 Refresh Token입니다" } });
      }
      return send({ status: 200, body: { accessToken: issueAccess(owner), uuid: owner.uuid } });
    }

    if (recorded.method === "GET" && recorded.path === "/api/auth/school/status") {
      if (!user) return send({ status: 403 });
      if (user.deleted) return send({ status: 400, body: { error: "유저를 찾을 수 없습니다" } });
      return send({
        status: 200,
        body: { verified: false, schoolName: null, schoolNameKo: null, domain: null },
      });
    }

    const handler = routes.get(`${recorded.method} ${recorded.path}`);
    if (!handler) return send({ status: 404, body: { error: "not found" } });
    return send(await handler(recorded, user));
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  function issueAccess(user: TestUser, expiresInSeconds = 3600) {
    const token = makeJwt({
      sub: user.email,
      uuid: user.uuid,
      userId: user.userId,
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
      jti: randomUUID(),
    });
    accessTokens.set(token, user);
    return token;
  }

  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    createUser(overrides: Partial<TestUser> = {}): TestUser {
      return {
        uuid: randomUUID(),
        userId: Math.floor(Math.random() * 1_000_000),
        email: `${randomUUID()}@test.dev`,
        ...overrides,
      };
    },
    issueAccess,
    issueRefresh(user: TestUser) {
      const token = makeJwt({ sub: user.email, exp: Math.floor(Date.now() / 1000) + 1209600 }, randomUUID());
      refreshTokens.set(token, user);
      return token;
    },
    route(key: string, handler: Handler) {
      routes.set(key, handler);
    },
    setDown(value: boolean) {
      down = value;
    },
    countRequests(method: string, path: string) {
      return requests.filter((r) => r.method === method && r.path === path).length;
    },
    reset() {
      requests.length = 0;
    },
    close() {
      return new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

export type MockBackend = Awaited<ReturnType<typeof startMockBackend>>;
