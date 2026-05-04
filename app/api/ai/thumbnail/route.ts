import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";
import { put } from "@vercel/blob";

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
  const prompt = `A sleek modern software project thumbnail banner for a project called "${projectName}". Tech stack: ${stackStr}.${descStr} Dark background, professional developer aesthetic, abstract geometric shapes, no text, no letters, no words.`;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-preview-image-generation",
    contents: prompt,
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData?.data);

  if (!imagePart?.inlineData?.data) {
    return NextResponse.json(
      { error: "이미지 생성에 실패했습니다." },
      { status: 500 },
    );
  }

  const buffer = Buffer.from(imagePart.inlineData.data, "base64");
  const mimeType = imagePart.inlineData.mimeType ?? "image/png";
  const ext = mimeType.split("/")[1] ?? "png";

  const blob = await put(`thumbnails/ai-${Date.now()}.${ext}`, buffer, {
    access: "public",
    contentType: mimeType,
  });

  return NextResponse.json({ url: blob.url });
}
