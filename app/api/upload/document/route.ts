import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { DOCUMENT_CONTENT_TYPE, MAX_DOCUMENT_BYTES } from "@/lib/uploadLimits";
import { requireVerifiedUser, withRefreshedSession } from "@/lib/verifiedUser";

// Blob 스토리지 용량 남용 방지 — 사용자당 분당 토큰 발급 수 제한
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

const DOCUMENT_PATH = /^documents\/[^/]+\.pdf$/i;

/**
 * 발표자료 PDF 직접 업로드용 토큰 발급 (`@vercel/blob/client`의 upload()가 호출한다).
 * 파일은 이 함수를 거치지 않고 브라우저에서 Blob으로 바로 올라가므로 4.5MB 본문 한도에 걸리지 않는다.
 * 토큰에 PDF·30MB·경로 제한을 실어 발급하고, 저장할 URL은 백엔드가 한 번 더 검증한다.
 */
export async function POST(req: NextRequest) {
  let body: HandleUploadBody;
  try {
    body = (await req.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN이 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  // 완료 콜백(onUploadCompleted)은 쓰지 않는다 — 저장할 URL은 게시글 작성 요청으로 백엔드가 받는다
  if (body.type !== "blob.generate-client-token") {
    return NextResponse.json({ error: "지원하지 않는 요청입니다." }, { status: 400 });
  }

  const auth = await requireVerifiedUser(req);
  if (!auth.ok) return auth.response;
  const { user } = auth;
  const respond = (payload: unknown, init?: ResponseInit) =>
    withRefreshedSession(NextResponse.json(payload, init), user);

  const limit = rateLimit(`upload:document:${user.uuid}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.allowed) return withRefreshedSession(rateLimitResponse(limit), user);

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!DOCUMENT_PATH.test(pathname)) {
          throw new Error("PDF 파일만 업로드할 수 있습니다.");
        }
        return {
          allowedContentTypes: [DOCUMENT_CONTENT_TYPE],
          maximumSizeInBytes: MAX_DOCUMENT_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ uploader: user.uuid }),
        };
      },
    });
    return respond(result);
  } catch (error) {
    return respond({ error: (error as Error).message }, { status: 400 });
  }
}
