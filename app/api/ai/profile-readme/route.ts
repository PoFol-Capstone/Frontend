import { NextRequest, NextResponse } from "next/server";
import { parseProfileReadmeInput } from "@/lib/aiInput";
import {
  aiErrorResponse,
  asString,
  backendErrorResponse,
  completeJson,
  consumeAiUsage,
  fetchAnalysis,
} from "@/lib/aiCoachServer";
import { assembleReadme, compactAnalysis, parseDirection } from "@/lib/coachContent";
import { http } from "@/lib/http.server";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { requireVerifiedUser, withRefreshedSession } from "@/lib/verifiedUser";
import type { Profile } from "@/types/user";

const LIMIT = 3;
const WINDOW_MS = 60_000;

/**
 * POST /api/ai/profile-readme — GitHub 프로필 README 초안 (마크다운)을 만들고 백엔드에 저장한다.
 * AI는 소개·대표 프로젝트·연락처 문단만 쓰고, 뱃지·통계 카드 같은 장식은 코드로 붙인다(URL을 지어내지 않도록).
 * 1차는 복사 방식만 — 사용자 GitHub에 직접 커밋하지 않는다.
 */
export async function POST(req: NextRequest) {
  const auth = await requireVerifiedUser(req);
  if (!auth.ok) return auth.response;
  const { user } = auth;
  const respond = (res: NextResponse) => withRefreshedSession(res, user);

  const limit = rateLimit(`ai:profile-readme:${user.uuid}`, LIMIT, WINDOW_MS);
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
  const input = parseProfileReadmeInput(body);
  if (!input.ok) return respond(NextResponse.json({ error: input.error }, { status: 400 }));
  const { targetRole, decorations, solvedacId, blogRss } = input.value;

  let analysis;
  let profile: Profile;
  try {
    [analysis, profile] = await Promise.all([
      fetchAnalysis(),
      http.get<Profile>(`/api/user/${user.uuid}`).then((r) => r.data),
    ]);
    if (analysis.status === "NONE" || !analysis.summary || !analysis.login) {
      return respond(NextResponse.json({ error: "GitHub 분석을 먼저 실행해주세요." }, { status: 409 }));
    }
  } catch (err) {
    return respond(backendErrorResponse(err, "GitHub 분석 결과를 불러오지 못했습니다."));
  }

  const usageError = await consumeAiUsage("profile-readme");
  if (usageError) return respond(usageError);

  const direction = parseDirection(analysis.direction);
  const featured = analysis.featuredRepos.length > 0
    ? analysis.featuredRepos
    : analysis.topRepos.map((r) => r.fullName);

  const prompt = `GitHub 프로필 README(${analysis.login}/${analysis.login})의 본문을 한국어 마크다운으로 작성합니다.

[분석 요약] ${JSON.stringify(compactAnalysis(analysis))}
[방향성] ${direction?.summary ?? "없음"}
[희망 직무] ${targetRole ?? profile.position ?? "없음"}
[대표 프로젝트] ${featured.join(", ") || "없음"}
[이름] ${profile.name}
[소개글] ${profile.bio ?? ""}
[연락처 후보] 이메일 ${profile.email}${profile.links.map((l) => `, ${l.url}`).join("")}

규칙:
- 데이터에 없는 경력·수치를 지어내지 마세요.
- 이모지·장식은 최소한으로. 기술 뱃지·통계 카드는 쓰지 마세요(따로 붙입니다).
- 대표 프로젝트는 레포 링크(https://github.com/{owner}/{repo})와 한 줄 설명으로.
응답은 반드시 아래 JSON 형식으로만 주세요.

{
  "intro": "# 제목 + 한 줄 소개 (2~3줄)",
  "projects": "## 대표 프로젝트 섹션 마크다운",
  "contact": "## 연락처 섹션 마크다운"
}`;

  let markdown: string;
  try {
    const raw = await completeJson(prompt);
    const ai = {
      intro: asString(raw.intro, 1_500),
      projects: asString(raw.projects, 4_000),
      contact: asString(raw.contact, 1_000),
    };
    if (!ai.intro) throw new Error("AI 응답이 비어 있습니다.");
    markdown = assembleReadme(ai, {
      login: analysis.login,
      decorations,
      skills: profile.skills,
      solvedacId,
      blogRss,
    });
  } catch (error) {
    return respond(aiErrorResponse(error, "AI 프로필 README"));
  }

  try {
    await http.put("/api/github/analysis/profile-readme", { text: markdown }, { requireAuth: true });
  } catch (err) {
    console.error("[ai/profile-readme] 초안 저장 실패:", err);
  }

  return respond(NextResponse.json({ markdown }));
}
