import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { generatePastelSvgBuffer } from "./_lib";

export async function POST(req: NextRequest) {
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
