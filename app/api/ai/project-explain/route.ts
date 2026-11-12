import { NextRequest, NextResponse } from "next/server";
import { parseProjectCardInput } from "@/lib/aiInput";
import { aiErrorResponse, backendErrorResponse, completeJson, consumeAiUsage } from "@/lib/aiCoachServer";
import { http } from "@/lib/http.server";
import { EXPLAIN_SYSTEM, toExplainData } from "@/lib/projectAssets";
import type { RepoContext } from "@/lib/projectCard";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { requireVerifiedUser, withRefreshedSession } from "@/lib/verifiedUser";
import type { Project } from "@/types/project";

const LIMIT = 3;
const WINDOW_MS = 60_000;
const TREE_PATHS = 400;
const README_CHARS = 2_000;

/**
 * POST /api/ai/project-explain — 핵심 파일 코드를 읽고 구현 설명(구조 · 흐름 · 파일 · 설계)을 만든다.
 * 입력: { projectUuid }. 결과는 백엔드 assets.explain에 저장돼 탭이 바로 읽는다.
 */
export async function POST(req: NextRequest) {
  const auth = await requireVerifiedUser(req);
  if (!auth.ok) return auth.response;
  const { user } = auth;
  const respond = (res: NextResponse) => withRefreshedSession(res, user);

  const limit = rateLimit(`ai:project-explain:${user.uuid}`, LIMIT, WINDOW_MS);
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
  const input = parseProjectCardInput(body);
  if (!input.ok) return respond(NextResponse.json({ error: input.error }, { status: 400 }));
  const path = `/api/projects/${encodeURIComponent(input.value.projectUuid)}`;

  let project: Project;
  let context: RepoContext;
  try {
    project = (await http.get<Project>(path, { requireAuth: true })).data;
    context = (await http.get<RepoContext>("/api/github/repo-context", {
      params: { repo: project.repoFullName },
      requireAuth: true,
    })).data;
  } catch (err) {
    return respond(backendErrorResponse(err, "레포 정보를 불러오지 못했습니다."));
  }

  // 레포가 안 바뀌었으면 AI를 다시 부르지 않는다 — 사용량도 차감하지 않음 (재생성 게이트)
  const saved = project.assets?.explain;
  if (saved && context.pushedAt && saved.pushedAt === context.pushedAt) {
    return respond(NextResponse.json({ project, unchanged: true }));
  }

  const usageError = await consumeAiUsage("project-explain");
  if (usageError) return respond(usageError);

  const { tree } = context;
  const data = {
    name: context.repo.name,
    description: context.repo.description,
    languages: context.repo.languages,
    readmeHead: context.repo.files.README?.slice(0, README_CHARS) ?? null,
    tree: tree.slice(0, TREE_PATHS),
    keyFiles: context.keyFiles ?? [],
  };

  let explain;
  try {
    const raw = await completeJson("project-explain", `레포 데이터:\n${JSON.stringify(data)}`, 0.2, EXPLAIN_SYSTEM);
    explain = toExplainData(raw, tree);
  } catch (error) {
    return respond(aiErrorResponse(error, "AI 구현 설명"));
  }
  if (!explain) {
    return respond(NextResponse.json({ error: "레포에서 근거를 찾지 못했어요." }, { status: 422 }));
  }

  try {
    const project = (await http.put<Project>(
      `${path}/assets/explain`,
      { pushedAt: context.pushedAt ?? "", data: explain },
      { requireAuth: true },
    )).data;
    return respond(NextResponse.json({ project }));
  } catch (err) {
    return respond(backendErrorResponse(err, "구현 설명을 저장하지 못했습니다."));
  }
}
