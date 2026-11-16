"use client";

import { useTranslations } from "next-intl";
import { Sparkles, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { clearJob, isWatched, useJobs } from "@/lib/aiCardJobs";

/** 그 탭을 보고 있지 않을 때 프로젝트 AI 작업 진행 · 완료를 알린다. 보기를 누르면 그 탭이 결과를 받는다 */
export default function CardJobNotice() {
  const t = useTranslations("profile.projects.cardNotice");
  const tTab = useTranslations("profile.projects.tabs");
  const jobs = [...useJobs()].filter(([key, job]) => job.status !== "seen" && !isWatched(key));
  if (jobs.length === 0) return null;

  return (
    <div className="fixed right-4 bottom-20 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2 md:bottom-6">
      {jobs.map(([key, job]) => (
        <div key={key} role="status" aria-live="polite"
          className="flex animate-fade-in-up items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-lg">
          <Sparkles className={`h-4 w-4 shrink-0 ${job.status === "running" ? "animate-pulse text-gray-400" : "text-gray-900"}`} />
          <span className="min-w-0 flex-1 truncate text-gray-700">
            <span className="font-medium text-gray-900">{tTab(job.kind)}</span> · {t(job.status, { repo: job.repo })}
          </span>
          {job.status !== "running" && (
            <>
              <Link href={`/profile?tab=projects&project=${encodeURIComponent(job.uuid)}&view=${job.kind}`}
                className="btn btn-primary btn-sm shrink-0">
                {t("view")}
              </Link>
              <button type="button" onClick={() => clearJob(key)} aria-label={t("close")}
                className="shrink-0 p-1 text-gray-400 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
