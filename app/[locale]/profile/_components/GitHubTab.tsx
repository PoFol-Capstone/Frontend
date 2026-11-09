"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { FaGithub } from "react-icons/fa";
import {
  RefreshCw,
  Star,
  Activity,
  FolderGit2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Users,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { Skeleton } from "@/components/Skeleton";
import Section from "@/components/ui/Section";
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

// GitHub linguist 색 — 목록에 없는 언어·기타는 회색
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Java: "#b07219", Kotlin: "#A97BFF", Python: "#3572A5",
  Go: "#00ADD8", Rust: "#dea584", C: "#555555", "C++": "#f34b7d", "C#": "#178600", Swift: "#F05138",
  Dart: "#00B4AB", Ruby: "#701516", PHP: "#4F5D95", HTML: "#e34c26", CSS: "#563d7c", SCSS: "#c6538c",
  Vue: "#41b883", Svelte: "#ff3e00", Shell: "#89e051", "Jupyter Notebook": "#DA5B0B", Dockerfile: "#384d54",
};
const languageColor = (name: string) => LANGUAGE_COLORS[name] ?? "#d1d5db";

type Props = {
  initialAnalysis: GitHubAnalysis | null;
  connected: boolean;
};

export default function GitHubTab({ initialAnalysis, connected }: Props) {
  const t = useTranslations("profile.github");
  const format = useFormatter();
  const now = useNow();
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
  const languages = summary ? groupLanguages(summary.languages) : [];

  return (
    <div className="space-y-8">
      {/* 히어로 — 상태 · 다시 분석 · 요약 숫자 */}
      <section aria-label={t("dashboardHeading")}
        className="relative overflow-hidden rounded-3xl bg-gray-900 p-6 text-white md:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 animate-blob rounded-full bg-indigo-500/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 left-1/4 h-64 w-64 animate-blob rounded-full bg-emerald-400/20 blur-3xl delay-700" />

        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <FaGithub size={28} />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight">{t("dashboardHeading")}</h2>
              <p className="mt-1 text-sm text-white/60">
                {analysis.analyzedAt
                  ? t("lastAnalyzed", {
                      when: format.dateTime(new Date(analysis.analyzedAt), { dateStyle: "medium", timeStyle: "short" }),
                    })
                  : t("neverAnalyzed")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isStarting || isAnalyzing}
            className="btn btn-sm bg-white text-gray-900 hover:bg-gray-100 focus-visible:ring-white/30"
          >
            <RefreshCw size={16} className={isAnalyzing ? "animate-spin" : ""} />
            {isAnalyzing ? t("analyzing") : analysis.status === "NONE" ? t("analyze") : t("reanalyze")}
          </button>
        </div>

        {/* 고치고 다시 분석하러 올 이유 — 줄어든 게 없으면 굳이 0을 보여주지 않는다 */}
        {analysis.progress && analysis.progress.resolvedCount > 0 && (
          <p className="relative mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-medium text-emerald-300 ring-1 ring-emerald-400/30">
            <TrendingUp size={14} />
            {t("progress", {
              when: format.dateTime(new Date(analysis.progress.previousAnalyzedAt), { dateStyle: "medium" }),
              count: analysis.progress.resolvedCount,
            })}
          </p>
        )}

        {isAnalyzing && (
          <div className="relative mt-6 h-1 overflow-hidden rounded-full bg-white/10" aria-hidden>
            <div className="absolute inset-y-0 w-1/2 animate-shine rounded-full bg-gradient-to-r from-transparent via-white/80 to-transparent" />
          </div>
        )}

        {summary && (
          <div className="relative mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat icon={<FolderGit2 size={16} />} label={t("ownedRepos")} value={summary.repoCount.owned}
              sub={t("forkedRepos", { count: summary.repoCount.forked })} />
            <Stat icon={<Star size={16} />} label={t("totalStars")} value={summary.totalStars} />
            <Stat icon={<Activity size={16} />} label={t("activeRepos")} value={summary.activeRepos90d} />
            <Stat icon={<Clock size={16} />} label={t("lastPush")}
              value={summary.lastPushedAt ? format.relativeTime(new Date(summary.lastPushedAt), now) : "-"} />
          </div>
        )}

        <p className="relative mt-6 text-xs text-white/40">{t("cacheHint")}</p>
      </section>

      {notice && (
        <p role="status" className="rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-700">{notice}</p>
      )}

      {analysis.status === "FAILED" && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">{analysis.failureReason ?? t("startFailed")}</p>
            {needsReconnect && <ConnectButton label={t("reconnect")} />}
          </div>
        </div>
      )}

      {analysis.status === "NONE" && (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-gradient-to-b from-gray-50 to-white p-12 text-center">
          <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
            <FolderGit2 className="text-gray-700" size={28} />
          </span>
          <p className="text-lg font-bold">{t("emptyTitle")}</p>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-gray-500">{t("emptyDesc")}</p>
        </div>
      )}

      {isAnalyzing && !summary && <AnalysisSkeleton />}

      {summary && (
        <>
          {!summary.hasProfileReadme && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-600">
                <AlertTriangle size={16} />
              </span>
              <div>
                <p className="font-semibold text-amber-900">{t("noProfileReadmeBanner")}</p>
                <p className="mt-0.5 text-amber-800/80">{t("noProfileReadmeHint")}</p>
              </div>
            </div>
          )}

          {languages.length > 0 && (
            <div className="card">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">{t("languages")}</h3>
              <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
                {languages.map((l) => (
                  <div key={l.name} className="h-full"
                    style={{ width: `${l.ratio * 100}%`, backgroundColor: languageColor(l.name) }}
                    title={l.name === OTHER_LANGUAGE ? t("otherLanguage") : l.name} />
                ))}
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                {languages.map((l) => (
                  <li key={l.name} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: languageColor(l.name) }} />
                    <span className="truncate text-gray-700">{l.name === OTHER_LANGUAGE ? t("otherLanguage") : l.name}</span>
                    <span className="ml-auto tabular-nums text-gray-400">{Math.round(l.ratio * 1000) / 10}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              {t("repoList")}
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">{analysis.repos.length}</span>
            </h3>
            <ul className="grid gap-3 md:grid-cols-2">
              {(showAllRepos ? analysis.repos : analysis.repos.slice(0, REPO_PREVIEW)).map((repo) => {
                const warnings = activeCheckCount(repo);
                return (
                  <li key={repo.fullName}
                    className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-200/60">
                    <div className="flex items-start justify-between gap-2">
                      {/* after:inset-0 — 카드 전체를 링크로 */}
                      <a href={`https://github.com/${repo.fullName}`} target="_blank" rel="noopener noreferrer"
                        className="flex min-w-0 items-center gap-2 font-semibold after:absolute after:inset-0 after:rounded-2xl">
                        <FolderGit2 size={16} className="shrink-0 text-gray-400" />
                        <span className="truncate group-hover:underline">{repo.name}</span>
                      </a>
                      {warnings > 0 ? (
                        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                          {t("warnings", { count: warnings })}
                        </span>
                      ) : (
                        <CheckCircle2 size={16} className="shrink-0 text-emerald-500" aria-hidden />
                      )}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-500">{repo.description ?? t("noDescription")}</p>
                    <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-xs text-gray-500">
                      {repo.language && (
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: languageColor(repo.language) }} />
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1"><Star size={12} />{repo.stars}</span>
                      {repo.ownership !== "OWNER" && (
                        <span className="flex items-center gap-1"><Users size={12} />{t("teamRepo", { count: repo.myCommitCount ?? 0 })}</span>
                      )}
                      {repo.pushedAt && <span>{format.relativeTime(new Date(repo.pushedAt), now)}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
            {analysis.repos.length > REPO_PREVIEW && (
              <button type="button" onClick={() => setShowAllRepos((v) => !v)}
                className="btn btn-secondary btn-sm mt-4 w-full">
                {showAllRepos ? t("showLess") : t("showAll", { count: analysis.repos.length })}
                <ChevronDown size={16} className={`transition ${showAllRepos ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>

          {/* 3.2 체크리스트 */}
          <RepoChecklist analysis={analysis} onChange={setAnalysis} />

          {/* 3.4 대표 프로젝트 · 방향성 */}
          <TopProjects analysis={analysis} onChange={setAnalysis} usage={usage} onUsageChange={refreshUsage} />

          {/* 3.3 프로필 README */}
          <ProfileReadmePanel analysis={analysis} onChange={setAnalysis} usage={usage} onUsageChange={refreshUsage} />

          {/* 타인 공개 범위 */}
          <Section card title={t("visibility.heading")} description={t("visibility.desc")}>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["summary", "languages", "topRepos", "direction"] as const).map((key) => (
                <label key={key}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm transition hover:bg-gray-50">
                  {t(`visibility.${key}`)}
                  <input
                    type="checkbox"
                    role="switch"
                    checked={analysis.visibility[key]}
                    onChange={(e) => handleVisibility(key, e.target.checked)}
                    className="peer sr-only"
                  />
                  <span aria-hidden
                    className="relative h-6 w-11 shrink-0 rounded-full bg-gray-200 transition after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:bg-gray-900 peer-checked:after:translate-x-5 peer-focus-visible:ring-4 peer-focus-visible:ring-gray-900/10" />
                </label>
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur">
      <div className="flex items-center gap-1.5 text-xs text-white/60">{icon}{label}</div>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-white/40">{sub}</p>}
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-6" aria-busy>
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
    </div>
  );
}

export function ConnectCard() {
  const t = useTranslations("profile.github");
  return (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-gradient-to-b from-gray-50 to-white p-12 text-center">
      <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gray-900 text-white shadow-lg shadow-gray-900/20">
        <FaGithub size={32} />
      </span>
      <p className="text-lg font-bold">{t("connectTitle")}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-gray-500">{t("connectDesc")}</p>
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
        className="btn btn-primary">
        <FaGithub size={16} /> {label}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
