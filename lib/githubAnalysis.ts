"use server";

import type {
  AiUsage,
  GitHubAnalysis,
  GitHubVisibility,
  PublicGitHub,
} from "@/types/githubAnalysis";
import { attempt, type ActionResult } from "./actionResult";
import { http } from "./http.server";

/**
 * 백엔드 GitHub 분석 API 클라이언트 (Server Functions).
 * 분석은 백엔드가 비동기로 수행하므로 startAnalysis 후 status가 ANALYZING이 아닐 때까지 getMyAnalysis로 조회한다.
 */

export async function getMyAnalysis(): Promise<ActionResult<GitHubAnalysis>> {
  return attempt(async () => (await http.get<GitHubAnalysis>("/api/github/analysis")).data);
}

/** 진행 중이면 409, 직전 분석 후 10분 이내면 429 — 호출부가 status로 문구를 고른다 */
export async function startAnalysis(): Promise<ActionResult<GitHubAnalysis>> {
  return attempt(async () => (await http.post<GitHubAnalysis>("/api/github/analysis")).data);
}

export async function setCheckIgnored(
  repoFullName: string | null,
  checkCode: string,
  ignored: boolean,
): Promise<ActionResult<null>> {
  return attempt(async () => {
    await http.put("/api/github/checks/ignore", { repoFullName, checkCode, ignored });
    return null;
  });
}

export async function setFeaturedRepos(repoFullNames: string[]): Promise<ActionResult<string[]>> {
  return attempt(
    async () => (await http.put<string[]>("/api/user/me/featured-repos", { repoFullNames })).data,
  );
}

export async function updateVisibility(
  patch: Partial<GitHubVisibility>,
): Promise<ActionResult<GitHubVisibility>> {
  return attempt(
    async () => (await http.patch<GitHubVisibility>("/api/github/analysis/visibility", patch)).data,
  );
}

export async function saveProfileReadmeDraft(text: string | null): Promise<ActionResult<null>> {
  return attempt(async () => {
    await http.put("/api/github/analysis/profile-readme", { text });
    return null;
  });
}

export async function getAiUsage(): Promise<ActionResult<AiUsage>> {
  return attempt(async () => (await http.get<AiUsage>("/api/ai/usage")).data);
}

/** 타인 프로필용 — 공개로 켠 항목과 대표 프로젝트만. 실패하면 null(섹션을 숨긴다) */
export async function getPublicGitHub(uuid: string): Promise<PublicGitHub | null> {
  try {
    return (await http.get<PublicGitHub>(`/api/user/${uuid}/github`)).data;
  } catch (err) {
    console.error("[profile] getPublicGitHub 실패:", err);
    return null;
  }
}

/** GitHub 연동 여부 (탭의 연동 유도 카드용). 확인 실패는 연동 안 된 것으로 본다 */
export async function getGithubConnected(): Promise<boolean> {
  try {
    const res = await http.get<{ connected: boolean }>("/api/auth/github/status", { requireAuth: true });
    return res.data.connected ?? false;
  } catch {
    return false;
  }
}
