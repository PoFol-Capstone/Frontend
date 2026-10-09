import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { getThumbnailProvider } from "./providers";
import { parseThumbnailInput } from "@/lib/aiInput";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { requireVerifiedUser, withRefreshedSession } from "@/lib/verifiedUser";

// Blob 스토리지에 파일을 쌓는 작업이라 사용자당 분당 생성 수를 제한
const LIMIT = 10;
const WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
  // 서명되지 않은 uuid 쿠키가 아니라 백엔드가 확인한 사용자로만 인증·제한한다
  const auth = await requireVerifiedUser(req);
  if (!auth.ok) return auth.response;
  const { user } = auth;
  const respond = (body: unknown, init?: ResponseInit) =>
    withRefreshedSession(NextResponse.json(body, init), user);

  const limit = rateLimit(`ai:thumbnail:${user.uuid}`, LIMIT, WINDOW_MS);
  if (!limit.allowed) return withRefreshedSession(rateLimitResponse(limit), user);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return respond({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  // provider에 넘기기 전에 검증한다 — 예전엔 projectName 누락·techStack: [null]이
  // provider 안에서 TypeError가 되어 500으로 새어 나갔다
  const input = parseThumbnailInput(body);
  if (!input.ok) return respond({ error: input.error }, { status: 400 });

  try {
    const provider = getThumbnailProvider();
    const asset = await provider.generate(input.value);

    // 같은 밀리초에 들어온 요청끼리 경로가 겹치지 않도록 UUID로 이름을 짓는다
    // (@vercel/blob 2.x는 addRandomSuffix 기본값이 false라 같은 경로면 업로드가 실패한다)
    const blob = await put(
      `thumbnails/ai-${crypto.randomUUID()}.${asset.extension}`,
      asset.buffer,
      { access: "public", contentType: asset.contentType },
    );

    return respond({ url: blob.url });
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number };
    console.error("썸네일 생성 에러:", err);
    return respond(
      { error: err.message ?? "이미지 생성에 실패했습니다." },
      { status: err.status ?? 500 },
    );
  }
}
