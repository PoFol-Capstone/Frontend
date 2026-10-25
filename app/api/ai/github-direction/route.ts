import { NextRequest, NextResponse } from "next/server";
import { parseDirectionInput } from "@/lib/aiInput";
import {
  aiErrorResponse,
  asString,
  asStringList,
  backendErrorResponse,
  completeJson,
  consumeAiUsage,
  fetchAnalysis,
} from "@/lib/aiCoachServer";
import { compactAnalysis } from "@/lib/coachContent";
import { http } from "@/lib/http.server";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { requireVerifiedUser, withRefreshedSession } from "@/lib/verifiedUser";
import type { DirectionResult } from "@/types/githubAnalysis";

// 월 한도(백엔드)와 별개로 연타를 막는 분당 제한
const LIMIT = 3;
const WINDOW_MS = 60_000;

/**
 * POST /api/ai/github-direction — GitHub 분석 요약으로 개발 방향성을 정리하고 백엔드에 저장한다.
 * 입력: { targetRole?: string } (희망 직무를 고르면 "맞는 점 / 보완할 점"을 함께 만든다)
 */
export async function POST(req: NextRequest) {
  const auth = await requireVerifiedUser(req);
  if (!auth.ok) return auth.response;
  const { user } = auth;
  const respond = (res: NextResponse) => withRefreshedSession(res, user);

  const limit = rateLimit(`ai:github-direction:${user.uuid}`, LIMIT, WINDOW_MS);
  if (!limit.allowed) return respond(rateLimitResponse(limit));

  if (!process.env.OPENAI_API_KEY) {
    return respond(NextResponse.json({ error: "OPENAI_API_KEY가 설정되지 않았습니다." }, { status: 500 }));
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return respond(NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 }));
  }
  const input = parseDirectionInput(body);
  if (!input.ok) return respond(NextResponse.json({ error: input.error }, { status: 400 }));
  const { targetRole } = input.value;

  let analysisSummary;
  try {
    const analysis = await fetchAnalysis();
    if (analysis.status === "NONE" || !analysis.summary) {
      return respond(NextResponse.json({ error: "GitHub 분석을 먼저 실행해주세요." }, { status: 409 }));
    }
    analysisSummary = compactAnalysis(analysis);
  } catch (err) {
    return respond(backendErrorResponse(err, "GitHub 분석 결과를 불러오지 못했습니다."));
  }

  const usageError = await consumeAiUsage("github-direction");
  if (usageError) return respond(usageError);

  const prompt = `다음은 한 대학생 개발자의 GitHub 공개 레포 분석 요약입니다 (코드 원문 없음).

${JSON.stringify(analysisSummary)}
${targetRole ? `\n희망 직무: ${targetRole}\n` : ""}
이 데이터에 근거해서만 한국어로 작성하세요. 데이터에 없는 경험을 지어내지 마세요.
응답은 반드시 아래 JSON 형식으로만 주세요.

{
  "summary": "어떤 성향의 개발자인지 2~3문장 (예: Spring·Java 중심의 백엔드 성향, 최근 Next.js로 확장 중)",
  "evidence": ["근거가 된 언어·프레임워크·레포 이름 칩 3~6개"],
  "fits": [${targetRole ? '"희망 직무와 맞는 점 2~3개"' : ""}],
  "gaps": [${targetRole ? '"희망 직무 기준으로 보완할 점 2~3개 (구체적인 다음 행동)"' : ""}]
}`;

  let result: DirectionResult;
  try {
    const raw = await completeJson(prompt);
    result = {
      summary: asString(raw.summary, 600),
      evidence: asStringList(raw.evidence, 6, 40),
      fits: targetRole ? asStringList(raw.fits, 3) : [],
      gaps: targetRole ? asStringList(raw.gaps, 3) : [],
      targetRole,
    };
    if (!result.summary) throw new Error("AI 응답이 비어 있습니다.");
  } catch (error) {
    return respond(aiErrorResponse(error, "AI 방향성 분석"));
  }

  // 같은 입력으로 다시 부르지 않도록 결과를 저장한다 (저장 실패해도 결과는 보여준다)
  try {
    await http.put("/api/github/analysis/direction", { text: JSON.stringify(result) }, { requireAuth: true });
  } catch (err) {
    console.error("[ai/github-direction] 결과 저장 실패:", err);
  }

  return respond(NextResponse.json(result));
}
