"use server";

import type { CardSlot, CardValue, GitHubRepoOption, Project, ProjectSummary } from "@/types/project";
import { attempt, type ActionResult } from "./actionResult";
import { http } from "./http.server";

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
