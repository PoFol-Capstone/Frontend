import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import {
  MAX_THUMBNAIL_BYTES,
  MAX_THUMBNAIL_MB,
  MAX_THUMBNAIL_REQUEST_BYTES,
  THUMBNAIL_EXTENSIONS,
} from "@/lib/uploadLimits";
import { requireVerifiedUser, withRefreshedSession } from "@/lib/verifiedUser";

// Blob 스토리지 용량 남용 방지 — 사용자당 분당 업로드 수 제한
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
  // 서명되지 않은 uuid 쿠키가 아니라 백엔드가 확인한 사용자로만 인증·제한한다
  const auth = await requireVerifiedUser(req);
  if (!auth.ok) return auth.response;
  const { user } = auth;
  const respond = (body: unknown, init?: ResponseInit) =>
    withRefreshedSession(NextResponse.json(body, init), user);

  const limit = rateLimit(`upload:thumbnail:${user.uuid}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.allowed) return withRefreshedSession(rateLimitResponse(limit), user);

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return respond(
      { error: "BLOB_READ_WRITE_TOKEN이 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const tooLarge = () =>
    respond(
      { error: `파일 크기는 ${MAX_THUMBNAIL_MB}MB를 초과할 수 없습니다.` },
      { status: 413 },
    );

  // 본문을 파싱하기 전에 선언된 크기로 먼저 거른다 (Vercel은 4.5 MB를 넘는 본문을 받지 않는다)
  const contentLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_THUMBNAIL_REQUEST_BYTES) {
    return tooLarge();
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return respond({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return respond({ error: "파일이 없습니다." }, { status: 400 });
  }

  const extension = THUMBNAIL_EXTENSIONS[file.type];
  if (!extension) {
    return respond({ error: "지원하지 않는 이미지 형식입니다." }, { status: 400 });
  }

  if (file.size > MAX_THUMBNAIL_BYTES) return tooLarge();

  // 같은 밀리초에 들어온 요청끼리 경로가 겹치지 않도록 UUID로 이름을 짓는다
  // (@vercel/blob 2.x는 addRandomSuffix 기본값이 false라 같은 경로면 업로드가 실패한다)
  const blob = await put(`thumbnails/${crypto.randomUUID()}.${extension}`, file.stream(), {
    access: "public",
    contentType: file.type,
  });

  return respond({ url: blob.url });
}
