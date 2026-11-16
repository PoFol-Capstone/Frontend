"use client";

import { useEffect } from "react";
import { jobKey, markJobSeen, useJob, watchJob, type JobKind } from "@/lib/aiCardJobs";
import type { Project } from "@/types/project";

/** 탭이 자기 AI 작업을 보고 있다고 알리고(전역 알림 숨김), 끝나면 결과를 받아 반영한다 */
export function useProjectJob(uuid: string, kind: JobKind, onDone: (project: Project) => void, failed: string) {
  const key = jobKey(uuid, kind);
  const job = useJob(key);

  useEffect(() => watchJob(key), [key]);
  useEffect(() => {
    if (job?.status !== "done") return;
    if (job.project) onDone(job.project);
    markJobSeen(key);
  }, [job, key, onDone]);

  return {
    busy: job?.status === "running",
    notice: job?.status === "seen" ? (job.notice ?? null) : null,
    error: job?.status === "error" ? (job.error ?? failed) : null,
  };
}
