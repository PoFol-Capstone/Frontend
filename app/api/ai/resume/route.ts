import { NextRequest, NextResponse } from "next/server";
import { parseResumeInput } from "@/lib/aiInput";
import {
  aiErrorResponse,
  asString,
  asStringList,
  backendErrorResponse,
  completeJson,
  consumeAiUsage,
  fetchAnalysis,
} from "@/lib/aiCoachServer";
import { compactAnalysis, parseDirection, verifiedFacts } from "@/lib/coachContent";
import { http } from "@/lib/http.server";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { requireVerifiedUser, withRefreshedSession } from "@/lib/verifiedUser";
import type { GitHubAnalysis } from "@/types/githubAnalysis";
import type { PagedResponse, ResponsePosts } from "@/types/post";
import type { ResumeContent, ResumeProject } from "@/types/resume";
import type { Profile } from "@/types/user";

const LIMIT = 3;
const WINDOW_MS = 60_000;
const POSTS_FOR_AI = 6;

/**
 * POST /api/ai/resume — 설문 + GitHub 분석 + Pofol 게시글로 이력서 초안(JSON)을 만든다.
 * 출처 표시: AI가 쓴 문장은 "AI", GitHub 수집값으로 만든 사실은 라우트가 직접 "VERIFIED"로 붙인다
 * (AI가 스스로 검증됐다고 주장하지 못하게). 저장은 사용자가 확인한 뒤 화면이 /api/resumes로 한다.
 */
export async function POST(req: NextRequest) {
  const auth = await requireVerifiedUser(req);
  if (!auth.ok) return auth.response;
  const { user } = auth;
  const respond = (res: NextResponse) => withRefreshedSession(res, user);

  const limit = rateLimit(`ai:resume:${user.uuid}`, LIMIT, WINDOW_MS);
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
  const input = parseResumeInput(body);
  if (!input.ok) return respond(NextResponse.json({ error: input.error }, { status: 400 }));
  const survey = input.value;

  let analysis: GitHubAnalysis | null;
  let profile: Profile;
  let posts: ResponsePosts[];
  try {
    [analysis, profile, posts] = await Promise.all([
      fetchAnalysis().then((a) => (a.status === "NONE" || !a.summary ? null : a)),
      http.get<Profile>(`/api/user/${user.uuid}`).then((r) => r.data),
      http
        .get<PagedResponse<ResponsePosts>>(`/api/user/${user.uuid}/posts`, { params: { size: POSTS_FOR_AI } })
        .then((r) => r.data.content),
    ]);
  } catch (err) {
    return respond(backendErrorResponse(err, "이력서 재료를 불러오지 못했습니다."));
  }

  const usageError = await consumeAiUsage("resume");
  if (usageError) return respond(usageError);

  const candidates = analysis
    ? (analysis.featuredRepos.length > 0 ? analysis.featuredRepos : analysis.topRepos.map((r) => r.fullName))
    : [];
  const pofolPosts = posts.map((p) => ({
    title: p.title,
    content: (p.content ?? "").slice(0, 400),
    skills: p.skills.map((s) => s.name),
  }));

  const prompt = `대학생 개발자의 이력서 초안을 한국어로 작성합니다.

[설문] ${JSON.stringify(survey)}
[GitHub 분석 요약] ${analysis ? JSON.stringify(compactAnalysis(analysis)) : "없음"}
[방향성] ${parseDirection(analysis?.direction ?? null)?.summary ?? "없음"}
[대표 프로젝트 후보 레포] ${candidates.join(", ") || "없음"}
[Pofol 게시글] ${JSON.stringify(pofolPosts)}
[보유 기술] ${profile.skills.map((s) => s.name).join(", ")}

규칙:
- 주어진 데이터에 없는 회사·수상·수치를 지어내지 마세요. 모르면 쓰지 마세요.
- 문장은 짧고 구체적으로. 프로젝트는 최대 3개.
- repoFullName은 대표 프로젝트 후보 레포 중 해당하는 것이 있을 때만, 없으면 null.
응답은 반드시 아래 JSON 형식으로만 주세요.

{
  "headline": "어떤 개발자인지 한 줄 정의",
  "summary": ["자기소개 문장 2~3개"],
  "projects": [
    { "name": "프로젝트 이름", "repoFullName": "owner/repo 또는 null", "role": "맡은 역할 한 문장", "highlights": ["역할·성과 문장 2~3개"] }
  ],
  "skills": ["기술 스택 지도: 주력부터 6~12개"]
}`;

  let content: ResumeContent;
  try {
    const raw = await completeJson(prompt, 0.4);
    const repos = new Map((analysis?.repos ?? []).map((r) => [r.fullName, r]));
    const projects: ResumeProject[] = (Array.isArray(raw.projects) ? raw.projects : [])
      .slice(0, 3)
      .filter((p): p is Record<string, unknown> => typeof p === "object" && p !== null)
      .map((p) => {
        const repoFullName = typeof p.repoFullName === "string" && repos.has(p.repoFullName) ? p.repoFullName : null;
        return {
          name: asString(p.name, 100) || repoFullName || "프로젝트",
          repoFullName,
          role: { text: asString(p.role, 300), source: "AI" as const },
          facts: verifiedFacts(repoFullName ? repos.get(repoFullName) : undefined),
          highlights: asStringList(p.highlights, 4).map((text) => ({ text, source: "AI" as const })),
        };
      });

    content = {
      headline: { text: asString(raw.headline, 200), source: "AI" },
      summary: asStringList(raw.summary, 4).map((text) => ({ text, source: "AI" as const })),
      projects,
      skills: asStringList(raw.skills, 15, 40),
    };
    if (!content.headline.text) throw new Error("AI 응답이 비어 있습니다.");
  } catch (error) {
    return respond(aiErrorResponse(error, "AI 이력서"));
  }

  return respond(NextResponse.json({ content }));
}
