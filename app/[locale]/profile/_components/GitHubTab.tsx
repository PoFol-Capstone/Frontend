"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { FaGithub } from "react-icons/fa";
import { RefreshCw, Star, Activity, FolderGit2, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/Skeleton";
import {
  getAiUsage,
  getMyAnalysis,
  startAnalysis,
  updateVisibility,
} from "@/lib/githubAnalysis";
import { activeCheckCount, groupLanguages, OTHER_LANGUAGE } from "@/lib/coachContent";
import type {
  AiUsage,
  GitHubAnalysis,
  GitHubVisibility,
} from "@/types/githubAnalysis";
import RepoChecklist from "./RepoChecklist";
import TopProjects from "./TopProjects";
import ProfileReadmePanel from "./ProfileReadmePanel";

// 분석은 백엔드가 비동기로 한다 — 2.5초 간격으로 최대 1분 조회
const POLL_INTERVAL_MS = 2_500;
const POLL_MAX_ATTEMPTS = 24;
const REPO_PREVIEW = 6;

const LANGUAGE_COLORS = ["bg-black", "bg-gray-600", "bg-gray-400", "bg-gray-300", "bg-gray-200", "bg-gray-100"];

type Props = {
  initialAnalysis: GitHubAnalysis | null;
  connected: boolean;
};

export default function GitHubTab({ initialAnalysis, connected }: Props) {
  const t = useTranslations("profile.github");
  const format = useFormatter();
  const [analysis, setAnalysis] = useState<GitHubAnalysis | null>(initialAnalysis);
  const [usage, setUsage] = useState<AiUsage | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [showAllRepos, setShowAllRepos] = useState(false);
  const pollCount = useRef(0);

  const refreshUsage = useCallback(async () => {
    const res = await getAiUsage();
    if (res.ok) setUsage(res.data);
  }, []);

  useEffect(() => {
    if (!connected) return;
    let cancelled = false;
    getAiUsage().then((res) => {
      if (!cancelled && res.ok) setUsage(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [connected]);

  // ANALYZING 동안만 조회한다. 상태가 바뀌거나 1분이 지나면 멈춘다
  const isAnalyzing = analysis?.status === "ANALYZING";
  useEffect(() => {
    if (!isAnalyzing) {
      pollCount.current = 0;
      return;
    }
    const timer = setTimeout(async () => {
      pollCount.current += 1;
      if (pollCount.current > POLL_MAX_ATTEMPTS) {
        setNotice(t("pollTimeout"));
        return;
      }
      const res = await getMyAnalysis();
      if (res.ok) setAnalysis(res.data);
    }, POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [isAnalyzing, analysis, t]);

  const handleAnalyze = async () => {
    setIsStarting(true);
    setNotice(null);
    const res = await startAnalysis();
    setIsStarting(false);
    if (res.ok) {
      pollCount.current = 0;
      setAnalysis(res.data);
      return;
    }
    if (res.status === 409) {
      setNotice(t("alreadyAnalyzing"));
      const latest = await getMyAnalysis();
      if (latest.ok) setAnalysis(latest.data);
    } else if (res.status === 429) {
      setNotice(t("cooldown"));
    } else {
      setNotice(res.error || t("startFailed"));
    }
  };

  const handleVisibility = async (key: keyof GitHubVisibility, value: boolean) => {
    if (!analysis) return;
    const prev = analysis.visibility;
    setAnalysis({ ...analysis, visibility: { ...prev, [key]: value } });
    const res = await updateVisibility({ [key]: value });
    if (!res.ok) {
      setAnalysis((a) => (a ? { ...a, visibility: prev } : a));
      setNotice(res.error);
    }
  };

  if (!connected) return <ConnectCard />;

  if (!analysis) {
    return <p role="alert" className="text-sm text-red-500">{t("loadFailed")}</p>;
  }

  const summary = analysis.summary;
  const needsReconnect = analysis.status === "FAILED" && analysis.failureReason?.includes("재연동");

  return (
    <div className="space-y-10">
      {/* 상태 · 다시 분석 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-500">
          {analysis.analyzedAt
            ? t("lastAnalyzed", {
                when: format.dateTime(new Date(analysis.analyzedAt), { dateStyle: "medium", timeStyle: "short" }),
              })
            : t("neverAnalyzed")}
          <span className="ml-2 text-xs text-gray-400">{t("cacheHint")}</span>
        </div>
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isStarting || isAnalyzing}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
        >
          <RefreshCw size={16} className={isAnalyzing ? "animate-spin" : ""} />
          {isAnalyzing ? t("analyzing") : analysis.status === "NONE" ? t("analyze") : t("reanalyze")}
        </button>
      </div>

      {notice && <p role="status" className="text-sm text-gray-600">{notice}</p>}

      {analysis.status === "FAILED" && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">{analysis.failureReason ?? t("startFailed")}</p>
          {needsReconnect && <ConnectButton label={t("reconnect")} />}
        </div>
      )}

      {analysis.status === "NONE" && (
        <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center">
          <FolderGit2 className="mx-auto mb-3 text-gray-400" size={36} />
          <p className="font-semibold">{t("emptyTitle")}</p>
          <p className="mt-1 text-sm text-gray-500">{t("emptyDesc")}</p>
        </div>
      )}

      {isAnalyzing && !summary && <AnalysisSkeleton />}

      {summary && (
        <>
          {!summary.hasProfileReadme && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold">{t("noProfileReadmeBanner")}</p>
                <p className="mt-0.5 text-gray-600">{t("noProfileReadmeHint")}</p>
              </div>
            </div>
          )}

          {/* 3.1 요약 대시보드 */}
          <section aria-label={t("dashboardHeading")} className="space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat icon={<FolderGit2 size={18} />} label={t("ownedRepos")} value={summary.repoCount.owned}
                sub={t("forkedRepos", { count: summary.repoCount.forked })} />
              <Stat icon={<Star size={18} />} label={t("totalStars")} value={summary.totalStars} />
              <Stat icon={<Activity size={18} />} label={t("activeRepos")} value={summary.activeRepos90d} />
              <Stat icon={<RefreshCw size={18} />} label={t("lastPush")}
                value={summary.lastPushedAt ? format.relativeTime(new Date(summary.lastPushedAt)) : "-"} />
            </div>

            {summary.languages.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">{t("languages")}</h3>
                <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
                  {groupLanguages(summary.languages).map((l, i) => (
                    <div key={l.name} className={LANGUAGE_COLORS[i]} style={{ width: `${l.ratio * 100}%` }}
                      title={l.name === OTHER_LANGUAGE ? t("otherLanguage") : l.name} />
                  ))}
                </div>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                  {groupLanguages(summary.languages).map((l, i) => (
                    <li key={l.name} className="flex items-center gap-1.5">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full border border-gray-300 ${LANGUAGE_COLORS[i]}`} />
                      {l.name === OTHER_LANGUAGE ? t("otherLanguage") : l.name} {Math.round(l.ratio * 1000) / 10}%
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="mb-3 text-sm font-semibold">{t("repoList")}</h3>
              <ul className="grid gap-3 md:grid-cols-2">
                {(showAllRepos ? analysis.repos : analysis.repos.slice(0, REPO_PREVIEW)).map((repo) => {
                  const warnings = activeCheckCount(repo);
                  return (
                    <li key={repo.fullName} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <a href={`https://github.com/${repo.fullName}`} target="_blank" rel="noopener noreferrer"
                          className="font-semibold hover:underline">
                          {repo.name}
                        </a>
                        {warnings > 0 && (
                          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            {t("warnings", { count: warnings })}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">{repo.description ?? t("noDescription")}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                        {repo.language && <span>{repo.language}</span>}
                        <span>★ {repo.stars}</span>
                        {repo.pushedAt && <span>{format.relativeTime(new Date(repo.pushedAt))}</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {analysis.repos.length > REPO_PREVIEW && (
                <button type="button" onClick={() => setShowAllRepos((v) => !v)}
                  className="mt-3 text-sm font-medium text-gray-600 hover:text-black">
                  {showAllRepos ? t("showLess") : t("showAll", { count: analysis.repos.length })}
                </button>
              )}
            </div>
          </section>

          {/* 3.2 체크리스트 */}
          <RepoChecklist analysis={analysis} onChange={setAnalysis} />

          {/* 3.4 대표 프로젝트 · 방향성 */}
          <TopProjects analysis={analysis} onChange={setAnalysis} usage={usage} onUsageChange={refreshUsage} />

          {/* 3.3 프로필 README */}
          <ProfileReadmePanel analysis={analysis} onChange={setAnalysis} usage={usage} onUsageChange={refreshUsage} />

          {/* 타인 공개 범위 */}
          <section className="rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold">{t("visibility.heading")}</h3>
            <p className="mt-1 text-sm text-gray-500">{t("visibility.desc")}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {(["summary", "languages", "topRepos", "direction"] as const).map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={analysis.visibility[key]}
                    onChange={(e) => handleVisibility(key, e.target.checked)}
                    className="h-4 w-4 accent-black"
                  />
                  {t(`visibility.${key}`)}
                </label>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-1.5 text-xs text-gray-500">{icon}{label}</div>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-6" aria-busy>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-3 w-full rounded-full" />
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    </div>
  );
}

function ConnectCard() {
  const t = useTranslations("profile.github");
  return (
    <div className="rounded-2xl border border-gray-200 p-10 text-center">
      <FaGithub className="mx-auto mb-3" size={36} />
      <p className="font-semibold">{t("connectTitle")}</p>
      <p className="mt-1 text-sm text-gray-500">{t("connectDesc")}</p>
      <ConnectButton label={t("connect")} />
    </div>
  );
}

/** 기존 게시글 작성 화면과 같은 GitHub 연동 흐름 (/api/auth/github/connect → GitHub 인가 페이지) */
function ConnectButton({ label }: { label: string }) {
  const t = useTranslations("profile.github");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const connect = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/github/connect");
      const data = await res.json();
      if (res.ok && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setError(data.error ?? t("connectFailed"));
    } catch {
      setError(t("connectFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4">
      <button type="button" onClick={connect} disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">
        <FaGithub size={16} /> {label}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
