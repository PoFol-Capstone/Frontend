import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { generatePastelSvgBuffer } from "./_lib";
import { getSessionUuid } from "@/lib/session";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

// Blob 스토리지에 파일을 쌓는 작업이라 사용자당 분당 생성 수를 제한
const LIMIT = 10;
const WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
  const uuid = await getSessionUuid();
  if (!uuid) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const limit = rateLimit(`ai:thumbnail:${uuid}`, LIMIT, WINDOW_MS);
  if (!limit.allowed) return rateLimitResponse(limit);

  try {
    const { projectName, techStack, projectDescription, mainFeatures } =
      await req.json();

    const buffer = generatePastelSvgBuffer({
      projectName,
      techStack: Array.isArray(techStack) ? techStack : [],
      projectDescription,
      mainFeatures,
    });

    const blob = await put(`thumbnails/ai-${Date.now()}.svg`, buffer, {
      access: "public",
      contentType: "image/svg+xml",
    });

    return NextResponse.json({ url: blob.url });
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number };
    console.error("썸네일 생성 에러:", err);
    return NextResponse.json(
      { error: err.message ?? "이미지 생성에 실패했습니다." },
      { status: err.status ?? 500 },
    );
  }
}
