"use client";

import { useSyncExternalStore } from "react";
import type { Project } from "@/types/project";

/**
 * 프로젝트 AI 작업(정리 카드 · 구현 설명 · 면접 연습 · 기술 추천) — 화면을 떠나도 계속 돌도록 컴포넌트 밖(모듈)에 둔다.
 * 그 탭이 보고 있으면 탭이 결과를 받고, 없으면 전역 알림(CardJobNotice)이 "완료 · 보기"를 띄운다.
 * shortcut: 새로고침 · 탭 닫기에는 사라진다 (서버 저장은 그대로 끝남), 필요하면 서버 작업 큐로.
 */
export type JobKind = "card" | "explain" | "interview" | "techReco";
export type JobResult = { project?: Project; error?: string; notice?: string };
export type CardJob = JobResult & {
  uuid: string;
  repo: string;
  kind: JobKind;
  /** seen: 탭이 결과를 받아 반영함 — 알림은 숨기고 notice("변경 없음" 등)만 탭에 남긴다 */
  status: "running" | "done" | "error" | "seen";
};

/** 프로젝트 · 탭마다 작업 하나 */
export const jobKey = (uuid: string, kind: JobKind) => `${uuid}:${kind}`;

let jobs: ReadonlyMap<string, CardJob> = new Map();
const watching = new Map<string, number>();
const listeners = new Set<() => void>();

const set = (key: string, job: CardJob | null) => {
  const next = new Map(jobs);
  if (job) next.set(key, job);
  else next.delete(key);
  jobs = next;
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** task가 project를 돌려주면 완료, 아니면 실패 */
export function startJob(uuid: string, repo: string, kind: JobKind, task: () => Promise<JobResult>) {
  const key = jobKey(uuid, kind);
  if (jobs.get(key)?.status === "running") return;
  const base = { uuid, repo, kind };
  set(key, { ...base, status: "running" });
  task()
    .then((r) => set(key, { ...base, ...r, status: r.project && !r.error ? "done" : "error" }))
    .catch(() => set(key, { ...base, status: "error" }));
}

export function startCardJob(uuid: string, repo: string) {
  startJob(uuid, repo, "card", async () => {
    const res = await fetch("/api/ai/project-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectUuid: uuid }),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { project: data.project } : { error: data.error };
  });
}

export const getJob = (key: string) => jobs.get(key);
export const clearJob = (key: string) => set(key, null);
export const markJobSeen = (key: string) => {
  const job = jobs.get(key);
  if (job) set(key, { ...job, project: undefined, status: "seen" });
};

/** 그 탭이 이 작업을 보고 있다고 알린다 — 보고 있으면 전역 알림은 숨긴다 */
export function watchJob(key: string) {
  // 스냅샷을 새로 만들어야 useSyncExternalStore가 알림을 다시 그린다
  const bump = (d: number) => {
    watching.set(key, (watching.get(key) ?? 0) + d);
    jobs = new Map(jobs);
    listeners.forEach((l) => l());
  };
  bump(1);
  return () => bump(-1);
}
export const isWatched = (key: string) => (watching.get(key) ?? 0) > 0;

export function useJobs() {
  return useSyncExternalStore(subscribe, () => jobs, () => jobs);
}

export function useJob(key: string) {
  return useJobs().get(key);
}
