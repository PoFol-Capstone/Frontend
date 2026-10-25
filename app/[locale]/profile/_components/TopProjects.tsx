"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Pin, PinOff, Sparkles } from "lucide-react";
import { setFeaturedRepos } from "@/lib/githubAnalysis";
import { parseDirection } from "@/lib/coachContent";
import type { AiUsage, DirectionResult, GitHubAnalysis } from "@/types/githubAnalysis";

/** 희망 직무 선택지 — 표시 문구(profile.github.roles.*)를 그대로 AI에 보낸다 */
export const TARGET_ROLES = ["backend", "frontend", "fullstack", "mobile", "data", "devops", "game"] as const;
const MAX_FEATURED = 3;

type Props = {
  analysis: GitHubAnalysis;
  onChange: (next: GitHubAnalysis) => void;
  usage: AiUsage | null;
  onUsageChange: () => void;
};

/** 3.4 대표 프로젝트 Top 3 (점수 대신 근거 칩) · AI 방향성 */
export default function TopProjects({ analysis, onChange, usage, onUsageChange }: Props) {
  const t = useTranslations("profile.github.top");
  const tRole = useTranslations("profile.github.roles");
  const [error, setError] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const direction = parseDirection(analysis.direction);
  const remaining = usage?.features.find((f) => f.feature === "github-direction")?.remaining ?? null;
  const repos = new Map(analysis.repos.map((r) => [r.fullName, r]));

  const toggleFeatured = async (fullName: string) => {
    const current = analysis.featuredRepos;
    const next = current.includes(fullName)
      ? current.filter((n) => n !== fullName)
      : [...current, fullName];
    if (next.length > MAX_FEATURED) {
      setError(t("featuredLimit", { max: MAX_FEATURED }));
      return;
    }
    setError(null);
    onChange({ ...analysis, featuredRepos: next });
    const res = await setFeaturedRepos(next);
    if (!res.ok) {
      onChange({ ...analysis, featuredRepos: current });
      setError(res.error);
    }
  };

  const generateDirection = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/github-direction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole: targetRole || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(res.status === 429 ? (data.error ?? t("limitReached")) : (data.error ?? t("aiFailed")));
        return;
      }
      onChange({ ...analysis, direction: JSON.stringify(data as DirectionResult) });
    } catch {
      setError(t("aiFailed"));
    } finally {
      setIsGenerating(false);
      onUsageChange();
    }
  };

  // 고정한 프로젝트가 점수 상위에 없어도 함께 보여준다
  const shown = [
    ...analysis.topRepos,
    ...analysis.featuredRepos
      .filter((name) => !analysis.topRepos.some((r) => r.fullName === name))
      .map((fullName) => ({ fullName, reasons: [] })),
  ];

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{t("heading")}</h2>
        <p className="mt-1 text-sm text-gray-500">{t("desc")}</p>
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-gray-500">{t("empty")}</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-3">
          {shown.map(({ fullName, reasons }) => {
            const repo = repos.get(fullName);
            const pinned = analysis.featuredRepos.includes(fullName);
            return (
              <li key={fullName} className={`flex flex-col rounded-2xl border p-5 ${pinned ? "border-black" : "border-gray-200"}`}>
                <a href={`https://github.com/${fullName}`} target="_blank" rel="noopener noreferrer"
                  className="font-semibold hover:underline">
                  {repo?.name ?? fullName}
                </a>
                <p className="mt-1 line-clamp-2 text-sm text-gray-500">{repo?.description ?? ""}</p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {reasons.map((reason) => (
                    <li key={reason} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                      {t(`reasons.${reason}`)}
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={() => toggleFeatured(fullName)}
                  className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-semibold text-gray-700 hover:text-black">
                  {pinned ? <PinOff size={14} /> : <Pin size={14} />}
                  {pinned ? t("unpin") : t("pin")}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="rounded-2xl border border-gray-200 p-5">
        <h3 className="font-semibold">{t("directionHeading")}</h3>
        {direction ? (
          <div className="mt-3 space-y-3 text-sm">
            <p className="leading-6">{direction.summary}</p>
            {direction.evidence.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {direction.evidence.map((e) => (
                  <li key={e} className="rounded-full border border-gray-300 px-2 py-0.5 text-xs">{e}</li>
                ))}
              </ul>
            )}
            {direction.targetRole && (direction.fits.length > 0 || direction.gaps.length > 0) && (
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="font-semibold">{t("fits", { role: direction.targetRole })}</p>
                  <ul className="mt-1 list-disc pl-5 text-gray-600">{direction.fits.map((f) => <li key={f}>{f}</li>)}</ul>
                </div>
                <div>
                  <p className="font-semibold">{t("gaps")}</p>
                  <ul className="mt-1 list-disc pl-5 text-gray-600">{direction.gaps.map((g) => <li key={g}>{g}</li>)}</ul>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500">{t("directionEmpty")}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)}
            aria-label={t("targetRole")}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">{t("targetRoleNone")}</option>
            {TARGET_ROLES.map((role) => <option key={role} value={tRole(role)}>{tRole(role)}</option>)}
          </select>
          <button type="button" onClick={generateDirection} disabled={isGenerating || remaining === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">
            <Sparkles size={14} />
            {isGenerating ? t("generating") : direction ? t("regenerate") : t("generate")}
          </button>
          {remaining !== null && <span className="text-xs text-gray-500">{t("remaining", { count: remaining })}</span>}
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    </section>
  );
}
