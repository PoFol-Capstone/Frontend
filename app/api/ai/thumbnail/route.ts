import { GoogleGenAI } from "@google/genai";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const { projectName, techStack, projectDescription } = await req.json();

  const stackStr = Array.isArray(techStack) ? techStack.join(", ") : "";
  const descStr = projectDescription
    ? ` ${(projectDescription as string).slice(0, 200)}`
    : "";

  // ✏️ 프롬프트 수정 위치
  const prompt = `
  A premium software project hero banner thumbnail for "${projectName}".
  16:9 composition,
  ${stackStr ? `Tech stack: ${stackStr}.` : ""}
  ${descStr ? `Project description: ${descStr}.` : ""}
  Luxurious deep black background, one large beautifully polished UI screen
  as the centerpiece, flat 2D interface, idealized premium app design,
  project title centered large overlay, bold white typography with subtle shadow,
  minimal and clean composition, sharp contrast, sleek modern SaaS aesthetic,
  highly eye-catching like a YouTube thumbnail, professional cinematic framing,
  accent colors adapted naturally to the project's theme and tech stack,
  high-end product showcase quality.`;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await ai.models.generateImages({
    model: "imagen-4.0-generate-001",
    prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: "16:9",
    },
  });

  const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;

  if (!imageBytes) {
    return NextResponse.json(
      { error: "이미지 생성에 실패했습니다." },
      { status: 500 },
    );
  }

  const buffer = Buffer.from(imageBytes, "base64");
  const mimeType = "image/png";
  const ext = "png";

  const blob = await put(`thumbnails/ai-${Date.now()}.${ext}`, buffer, {
    access: "public",
    contentType: mimeType,
  });

  return NextResponse.json({ url: blob.url });
}
