"use server";

import type { CardSlot, CardValue, GitHubRepoOption, Project, ProjectSummary } from "@/types/project";
import type { GitHubAnalysis } from "@/types/githubAnalysis";
import { attempt, type ActionResult } from "./actionResult";
import { parseDirection } from "./coachContent";
import { http } from "./http.server";
import type { JobTrendSnapshot } from "./jobTrends";
import type { RepoContext } from "./projectCard";
import { buildTechReco } from "./techReco";
import { JOBS_DIR, readSnapshots } from "./trends.server";

/**
 * 백엔드 프로젝트 API 클라이언트 (Server Functions).
 * 남의 프로젝트는 백엔드가 404로 숨긴다. 호출부가 status(404 · 409)로 문구를 고른다.
 */

export async function getMyProjects(): Promise<ActionResult<ProjectSummary[]>> {
  return attempt(async () => (await http.get<ProjectSummary[]>("/api/projects")).data);
}

export async function getProject(uuid: string): Promise<ActionResult<Project>> {
  return attempt(async () => (await http.get<Project>(`/api/projects/${encodeURIComponent(uuid)}`)).data);
}

/** 이미 등록한 레포면 409, 비공개 레포면 400 */
export async function createProject(repoFullName: string): Promise<ActionResult<Project>> {
  return attempt(async () => (await http.post<Project>("/api/projects", { repoFullName })).data);
}

export async function updateCardSlot<S extends CardSlot>(
  uuid: string,
  slot: S,
  value: CardValue<S>,
): Promise<ActionResult<Project>> {
  return attempt(
    async () =>
      (await http.patch<Project>(`/api/projects/${encodeURIComponent(uuid)}/card`, { slot, value })).data,
  );
}

/** 레포 원자료로 AI 없이 빈 칸(내 역할 · 결과)을 채운다 — 백엔드 ProjectFacts, 출처 ✅ 검증됨 */
export async function fillCardFacts(uuid: string): Promise<ActionResult<Project>> {
  return attempt(async () => (await http.post<Project>(`/api/projects/${encodeURIComponent(uuid)}/card/facts`)).data);
}

export async function updateProject(
  uuid: string,
  patch: { postUuid?: string; unlinkPost?: boolean; displayOrder?: number },
): Promise<ActionResult<Project>> {
  return attempt(async () => (await http.patch<Project>(`/api/projects/${encodeURIComponent(uuid)}`, patch)).data);
}

export async function deleteProject(uuid: string): Promise<ActionResult<null>> {
  return attempt(async () => {
    await http.delete(`/api/projects/${encodeURIComponent(uuid)}`);
    return null;
  });
}

/** 레포 가져오기 목록 — 내 GitHub 레포 (기존 GET /api/github/repos) */
export async function getMyGitHubRepos(): Promise<ActionResult<GitHubRepoOption[]>> {
  return attempt(async () => (await http.get<GitHubRepoOption[]>("/api/github/repos")).data);
}

/** 면접 연습 기록 — 질문에 내 답을 저장한다. 10개 연습이면 단계가 INTERVIEW_READY로 */
export async function recordInterviewPractice(
  uuid: string,
  questionId: string,
  answer: string,
): Promise<ActionResult<Project>> {
  return attempt(
    async () =>
      (await http.patch<Project>(`/api/projects/${encodeURIComponent(uuid)}/assets/interview/practice`, {
        questionId,
        answer,
      })).data,
  );
}

/**
 * 기술 추천 생성 — AI 호출 없음. (희망 직군 공고의 우대 기술 − 레포 감지 기술)을 저장한다.
 * 공고 스냅샷(data/trends/jobs)이 없으면 사전 폴백을 쓰고, 이전 [해봤어요] 체크는 유지한다.
 */
export async function generateTechReco(uuid: string): Promise<ActionResult<Project>> {
  return attempt(async () => {
    const path = `/api/projects/${encodeURIComponent(uuid)}`;
    const project = (await http.get<Project>(path)).data;
    const context = (
      await http.get<RepoContext>("/api/github/repo-context", { params: { repo: project.repoFullName } })
    ).data;

    let targetRole: string | null = null;
    try {
      const analysis = (await http.get<GitHubAnalysis>("/api/github/analysis")).data;
      targetRole = parseDirection(analysis.direction)?.targetRole ?? null;
    } catch {
      // GitHub 분석 전이면 직군 없이 전체 기준으로 추천한다
    }

    const snapshot = readSnapshots<JobTrendSnapshot>(JOBS_DIR).at(-1) ?? null;
    const reco = buildTechReco(context, snapshot, targetRole, project.assets?.techReco?.items);
    return (await http.put<Project>(`${path}/assets/techReco`, reco)).data;
  });
}

/** 기술 추천 [해봤어요] 체크 */
export async function setTechRecoDone(uuid: string, id: string, done: boolean): Promise<ActionResult<Project>> {
  return attempt(
    async () =>
      (await http.patch<Project>(`/api/projects/${encodeURIComponent(uuid)}/assets/tech-reco/done`, { id, done }))
        .data,
  );
}
