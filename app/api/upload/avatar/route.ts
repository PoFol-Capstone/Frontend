import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import {
  AVATAR_EXTENSIONS,
  MAX_AVATAR_BYTES,
  MAX_AVATAR_MB,
  MAX_AVATAR_REQUEST_BYTES,
} from "@/lib/uploadLimits";
import { requireVerifiedUser, withRefreshedSession } from "@/lib/verifiedUser";

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

/**
 * 프로필 사진 업로드 (썸네일 라우트와 같은 서버 경유 방식, 2MB·png/jpg/webp).
 * 업로드된 URL은 프로필 저장 시 PATCH /api/user/me의 avatarUrl로 백엔드에 보내고,
 * 백엔드는 Vercel Blob 호스트인지 다시 확인한다.
 */
export async function POST(req: NextRequest) {
  const auth = await requireVerifiedUser(req);
  if (!auth.ok) return auth.response;
  const { user } = auth;
  const respond = (body: unknown, init?: ResponseInit) =>
    withRefreshedSession(NextResponse.json(body, init), user);

  const limit = rateLimit(`upload:avatar:${user.uuid}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.allowed) return withRefreshedSession(rateLimitResponse(limit), user);

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return respond({ error: "BLOB_READ_WRITE_TOKEN이 설정되지 않았습니다." }, { status: 500 });
  }

  const tooLarge = () =>
    respond({ error: `파일 크기는 ${MAX_AVATAR_MB}MB를 초과할 수 없습니다.` }, { status: 413 });

  const contentLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_AVATAR_REQUEST_BYTES) {
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

  const extension = AVATAR_EXTENSIONS[file.type];
  if (!extension) {
    return respond({ error: "지원하지 않는 이미지 형식입니다." }, { status: 400 });
  }

  if (file.size > MAX_AVATAR_BYTES) return tooLarge();

  const blob = await put(`avatars/${crypto.randomUUID()}.${extension}`, file.stream(), {
    access: "public",
    contentType: file.type,
  });

  return respond({ url: blob.url });
}
