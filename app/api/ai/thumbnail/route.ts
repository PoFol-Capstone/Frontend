import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
        { status: 500 },
      );
    }

    const { projectName, techStack, projectDescription, mainFeatures } =
      await req.json();

    const stackStr = Array.isArray(techStack) ? techStack.join(", ") : "";
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 1단계: GPT로 시각적 개념 추출
    const conceptRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: `You are a creative director. Given a software project, identify the best visual concept for its thumbnail illustration.

Project name: ${projectName}
Tech stack: ${stackStr}
Description: ${projectDescription ?? ""}
Main features: ${mainFeatures ?? ""}

Return JSON with these fields:
{
  "visualElement": "the single most iconic real-world object that represents this project (e.g. refrigerator, checklist clipboard, calendar, stethoscope, shopping cart). Be specific and concrete.",
  "colors": "2-3 hex color codes that match the domain mood, comma-separated",
  "mood": "one of: professional, friendly, technical, energetic, calm",
  "style": "one of: flat illustration, isometric 3D, minimalist icon art"
}`,
        },
      ],
    });

    let concept = {
      visualElement: "computer screen with code",
      colors: "#4F46E5, #818CF8, #1E1B4B",
      mood: "professional",
      style: "flat illustration",
    };
    try {
      const parsed = JSON.parse(
        conceptRes.choices[0]?.message?.content ?? "{}",
      );
      if (parsed.visualElement) concept = parsed;
    } catch {
      // fallback to default concept
    }

    // 2단계: 추출된 개념으로 DALL-E 3 프롬프트 생성
    const prompt = `A professional software project thumbnail illustration.
The hero element is a large, detailed ${concept.visualElement} rendered in ${concept.style} style.
Color palette: ${concept.colors}.
${concept.mood} atmosphere, clean gradient background.
Wide 16:9 banner composition with the hero element centered or slightly right.
No text, no letters, no words, no UI mockups, no screenshots.
High quality, sharp edges, visually balanced.`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1792x1024",
      quality: "hd",
      response_format: "b64_json",
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json(
        { error: "이미지 생성에 실패했습니다." },
        { status: 500 },
      );
    }

    const buffer = Buffer.from(b64, "base64");
    const blob = await put(`thumbnails/ai-${Date.now()}.png`, buffer, {
      access: "public",
      contentType: "image/png",
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
