import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { AiFeature, GitHubAnalysis } from "@/types/githubAnalysis";
import { ApiError, http } from "./http.server";

/**
 * 포트폴리오 코치 AI 라우트(github-direction·profile-readme·resume) 공용 서버 로직.
 *
 * - 분석 데이터는 클라이언트가 보낸 값을 믿지 않고 라우트가 백엔드에서 직접 읽는다.
 * - OpenAI 호출 전에 백엔드 월 사용량을 1회 차감한다 (남은 횟수가 없으면 429로 끝낸다).
 * - 모델은 기존 summarize 라우트와 같은 gpt-4o-mini로 시작한다.
 */

export const AI_MODEL = "gpt-4o-mini";

/** 백엔드 오류를 라우트 응답으로 — 메시지를 그대로 실어 화면이 사유를 보여준다 */
export function backendErrorResponse(err: unknown, fallback: string): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message || fallback }, { status: err.status ?? 502 });
  }
  return NextResponse.json({ error: fallback }, { status: 502 });
}

export async function fetchAnalysis(): Promise<GitHubAnalysis> {
  const res = await http.get<GitHubAnalysis>("/api/github/analysis", { requireAuth: true });
  return res.data;
}

/** 월 사용량 1회 차감. 한도 초과(429)·인증 실패는 응답으로 돌려준다 */
export async function consumeAiUsage(feature: AiFeature): Promise<NextResponse | null> {
  try {
    await http.post("/api/ai/usage/consume", { feature }, { requireAuth: true });
    return null;
  } catch (err) {
    return backendErrorResponse(err, "AI 사용 횟수를 확인하지 못했습니다.");
  }
}

/** JSON 응답을 강제한 단일 프롬프트 호출 */
export async function completeJson(prompt: string, temperature = 0.5): Promise<Record<string, unknown>> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature,
  });
  const parsed = JSON.parse(completion.choices[0].message.content ?? "{}");
  return typeof parsed === "object" && parsed !== null ? parsed : {};
}

export function aiErrorResponse(error: unknown, label: string): NextResponse {
  const err = error as { message?: string; status?: number };
  console.error(`${label} 에러:`, err);
  return NextResponse.json(
    { error: err.message ?? "AI 생성에 실패했습니다." },
    { status: err.status ?? 500 },
  );
}

export const asString = (v: unknown, max = 2_000): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export const asStringList = (v: unknown, maxItems = 8, maxLen = 300): string[] =>
  Array.isArray(v)
    ? v
        .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
        .slice(0, maxItems)
        .map((x) => x.trim().slice(0, maxLen))
    : [];
