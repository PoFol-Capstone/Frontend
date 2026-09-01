import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSessionUuid } from "@/lib/session";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

// Blob 스토리지 용량 남용 방지 — 사용자당 분당 업로드 수 제한
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const uuid = await getSessionUuid();
  if (!uuid) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const limit = rateLimit(`upload:thumbnail:${uuid}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.allowed) return rateLimitResponse(limit);

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN이 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "지원하지 않는 이미지 형식입니다." },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "파일 크기는 5MB를 초과할 수 없습니다." },
      { status: 400 },
    );
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const blob = await put(`thumbnails/${Date.now()}.${ext}`, file.stream(), {
    access: "public",
    contentType: file.type,
  });

  return NextResponse.json({ url: blob.url });
}
