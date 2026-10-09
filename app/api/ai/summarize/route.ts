import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { parseSummarizeInput } from "@/lib/aiInput";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { requireVerifiedUser, withRefreshedSession } from "@/lib/verifiedUser";

// OpenAI 호출은 요청당 비용이 발생하므로 사용자당 분당 호출 수를 제한
const LIMIT = 5;
const WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
  // 서명되지 않은 uuid 쿠키가 아니라 백엔드가 확인한 사용자로만 인증·제한한다
  const auth = await requireVerifiedUser(req);
  if (!auth.ok) return auth.response;
  const { user } = auth;
  const respond = (body: unknown, init?: ResponseInit) =>
    withRefreshedSession(NextResponse.json(body, init), user);

  const limit = rateLimit(`ai:summarize:${user.uuid}`, LIMIT, WINDOW_MS);
  if (!limit.allowed) return withRefreshedSession(rateLimitResponse(limit), user);

  if (!process.env.OPENAI_API_KEY) {
    return respond(
      { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  // 클라이언트 body는 신뢰할 수 없으므로 타입·길이를 확인하고 정규화
  // (예전에는 techStack이 배열이 아니거나 readmeText가 문자열이 아니면 TypeError로 500이 났다)
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return respond({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const input = parseSummarizeInput(body);
  if (!input.ok) return respond({ error: input.error }, { status: 400 });
  const { projectName, readmeText, techStack } = input.value;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `다음은 GitHub 프로젝트 정보입니다.

프로젝트명: ${projectName}
기술 스택: ${techStack.join(", ")}
README:
${readmeText}

위 정보를 바탕으로 아래 두 가지를 한국어로 작성해주세요.
응답은 반드시 JSON 형식으로만 주세요.

{
  "projectDescription": "프로젝트를 2~3문장으로 간결하게 설명",
  "mainFeatures": "주요 기능을 줄바꿈으로 구분된 목록 (앞에 번호나 기호 없이)"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const result = JSON.parse(completion.choices[0].message.content ?? "{}");

    return respond({
      projectDescription: result.projectDescription ?? "",
      mainFeatures: result.mainFeatures ?? "",
    });
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number };
    console.error("AI 요약 에러:", err);
    return respond(
      { error: err.message ?? "AI 요약에 실패했습니다." },
      { status: err.status ?? 500 },
    );
  }
}
