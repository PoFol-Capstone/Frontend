import { NextRequest, NextResponse } from "next/server";
import { parseProjectCardInput } from "@/lib/aiInput";
import { aiErrorResponse, backendErrorResponse, completeJson, consumeAiUsage } from "@/lib/aiCoachServer";
import { http } from "@/lib/http.server";
import { latestThemeSnapshot, themeSources, themesFor } from "@/lib/interviewThemes.server";
import { INTERVIEW_SYSTEM, toInterviewBank } from "@/lib/projectAssets";
import { summarizeCommits, type RepoContext } from "@/lib/projectCard";
import { detectedTech } from "@/lib/techReco";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { requireVerifiedUser, withRefreshedSession } from "@/lib/verifiedUser";
import type { Project } from "@/types/project";

const LIMIT = 3;
const WINDOW_MS = 60_000;
const TREE_PATHS = 400;

/**
 * POST /api/ai/interview-questions — 내 코드 · 커밋 · 자주 나오는 주제를 근거로 면접 질문 15개를 만든다.
 * 입력: { projectUuid }. 결과는 assets.interview에 저장 — 연습 기록(답 · 시각)도 같은 곳에 쌓인다.
 * 레포가 안 바뀌었으면 기존 질문을 유지한다 (사용량 차감 없음).
 */
export async function POST(req: NextRequest) {
  const auth = await requireVerifiedUser(req);
  if (!auth.ok) return auth.response;
  const { user } = auth;
  const respond = (res: NextResponse) => withRefreshedSession(res, user);

  const limit = rateLimit(`ai:interview-questions:${user.uuid}`, LIMIT, WINDOW_MS);
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

  // 레포가 안 바뀌었으면 질문을 다시 만들지 않는다 — 연습 기록도 보존 (재생성 게이트)
  const saved = project.assets?.interview;
  if (saved && context.pushedAt && saved.pushedAt === context.pushedAt) {
    return respond(NextResponse.json({ project, unchanged: true }));
  }

  const usageError = await consumeAiUsage("interview-questions");
  if (usageError) return respond(usageError);

  const { tree } = context;
  const fixCandidates = context.fixCandidates ?? [];
  const snapshot = latestThemeSnapshot();
  const themes = themesFor(detectedTech(context.repo).map((t) => t.id), snapshot);
  const commits = summarizeCommits(context.commits, context.myLogin);
  const myShas = new Set(
    context.commits
      .filter((c) => c.sha && c.author && c.author.toLowerCase() === context.myLogin?.toLowerCase())
      .map((c) => c.sha!),
  );
  for (const f of fixCandidates) myShas.add(f.sha);

  const data = {
    name: context.repo.name,
    description: context.repo.description,
    languages: context.repo.languages,
    tree: tree.slice(0, TREE_PATHS),
    keyFiles: context.keyFiles ?? [],
    myFiles: context.myFiles ?? [],
    fixCandidates,
    card: project.card,
    themes,
    commits: { mine: commits.mine, myMessages: commits.myMessages.slice(0, 30) },
  };

  let questions;
  try {
    const raw = await completeJson("interview-questions", `레포 데이터:\n${JSON.stringify(data)}`, 0.7, INTERVIEW_SYSTEM);
    questions = toInterviewBank(raw, tree, myShas, themes);
  } catch (error) {
    return respond(aiErrorResponse(error, "AI 면접 질문"));
  }
  if (!questions) {
    return respond(NextResponse.json({ error: "레포에서 질문 근거를 충분히 찾지 못했어요." }, { status: 422 }));
  }

  try {
    const result = (await http.put<Project>(
      `${path}/assets/interview`,
      { pushedAt: context.pushedAt ?? "", questions, themeSources: themeSources(snapshot) },
      { requireAuth: true },
    )).data;
    return respond(NextResponse.json({ project: result }));
  } catch (err) {
    return respond(backendErrorResponse(err, "면접 질문을 저장하지 못했습니다."));
  }
}
