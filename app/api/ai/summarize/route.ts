import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { projectName, readmeText, techStack } = await req.json();

  const prompt = `다음은 GitHub 프로젝트 정보입니다.

프로젝트명: ${projectName}
기술 스택: ${(techStack as string[]).join(", ")}
README:
${(readmeText as string).slice(0, 3000)}

위 정보를 바탕으로 아래 두 가지를 한국어로 작성해주세요.
응답은 반드시 JSON 형식으로만 주세요.

{
  "projectDescription": "프로젝트를 2~3문장으로 간결하게 설명",
  "mainFeatures": "주요 기능을 줄바꿈으로 구분된 목록 (앞에 번호나 기호 없이)"
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.5,
  });

  const result = JSON.parse(completion.choices[0].message.content ?? "{}");

  return NextResponse.json({
    projectDescription: result.projectDescription ?? "",
    mainFeatures: result.mainFeatures ?? "",
  });
}
