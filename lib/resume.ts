"use server";

import type { Resume, ResumeContent, ResumeSummary, ResumeSurvey } from "@/types/resume";
import { attempt, type ActionResult } from "./actionResult";
import { http } from "./http.server";

/** 백엔드 /api/resumes 클라이언트 (본인 이력서만) */

export async function listResumes(): Promise<ActionResult<ResumeSummary[]>> {
  return attempt(async () => (await http.get<ResumeSummary[]>("/api/resumes")).data);
}

export async function getResume(uuid: string): Promise<ActionResult<Resume>> {
  return attempt(async () => (await http.get<Resume>(`/api/resumes/${uuid}`)).data);
}

export async function createResume(body: {
  title: string;
  survey: ResumeSurvey;
  content: ResumeContent;
}): Promise<ActionResult<Resume>> {
  return attempt(async () => (await http.post<Resume>("/api/resumes", body)).data);
}

export async function updateResume(
  uuid: string,
  patch: Partial<Pick<Resume, "title" | "content" | "showPhoto">>,
): Promise<ActionResult<Resume>> {
  return attempt(async () => (await http.patch<Resume>(`/api/resumes/${uuid}`, patch)).data);
}

export async function deleteResume(uuid: string): Promise<ActionResult<null>> {
  return attempt(async () => {
    await http.delete(`/api/resumes/${uuid}`);
    return null;
  });
}
