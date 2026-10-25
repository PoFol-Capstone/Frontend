"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, ExternalLink, Sparkles } from "lucide-react";
import { MarkdownPreview } from "@/components/MarkdownPreview";
import { saveProfileReadmeDraft } from "@/lib/githubAnalysis";
import { blogWorkflowYaml } from "@/lib/coachContent";
import type { AiUsage, GitHubAnalysis, ReadmeDecoration } from "@/types/githubAnalysis";
import { TARGET_ROLES } from "./TopProjects";

const DECORATIONS: ReadmeDecoration[] = ["badges", "stats", "streak", "header", "solvedac", "blog"];

type Props = {
  analysis: GitHubAnalysis;
  onChange: (next: GitHubAnalysis) => void;
  usage: AiUsage | null;
  onUsageChange: () => void;
};

/**
 * 3.3 프로필 README 점검 · 초안 생성 · 꾸미기 추천.
 * 1차는 복사 방식만 — 사용자 GitHub에 직접 커밋하지 않는다.
 */
export default function ProfileReadmePanel({ analysis, onChange, usage, onUsageChange }: Props) {
  const t = useTranslations("profile.github.readme");
  const tRole = useTranslations("profile.github.roles");
  const [decorations, setDecorations] = useState<ReadmeDecoration[]>(["badges"]);
  const [targetRole, setTargetRole] = useState("");
  const [solvedacId, setSolvedacId] = useState("");
  const [blogRss, setBlogRss] = useState("");
  const [draft, setDraft] = useState(analysis.profileReadmeDraft ?? "");
  const [mode, setMode] = useState<"edit" | "preview">("preview");
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const remaining = usage?.features.find((f) => f.feature === "profile-readme")?.remaining ?? null;
  const login = analysis.login;
  const hasProfileReadme = analysis.summary?.hasProfileReadme ?? false;
  const dirty = draft !== (analysis.profileReadmeDraft ?? "");

  const toggle = (d: ReadmeDecoration) =>
    setDecorations((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const generate = async () => {
    setIsGenerating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/ai/profile-readme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: targetRole || null,
          decorations,
          solvedacId: decorations.includes("solvedac") ? solvedacId : null,
          blogRss: decorations.includes("blog") ? blogRss : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ kind: "error", text: data.error ?? t("failed") });
        return;
      }
      setDraft(data.markdown);
      setMode("preview");
      onChange({ ...analysis, profileReadmeDraft: data.markdown });
    } catch {
      setMessage({ kind: "error", text: t("failed") });
    } finally {
      setIsGenerating(false);
      onUsageChange();
    }
  };

  const save = async () => {
    const res = await saveProfileReadmeDraft(draft || null);
    if (res.ok) {
      onChange({ ...analysis, profileReadmeDraft: draft || null });
      setMessage({ kind: "info", text: t("saved") });
    } else {
      setMessage({ kind: "error", text: res.error });
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ kind: "info", text: t("copied") });
    } catch {
      setMessage({ kind: "error", text: t("copyFailed") });
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">{t("heading")}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {hasProfileReadme ? t("exists") : t("missing", { login: login ?? "" })}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold">{t("decorations")}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {DECORATIONS.map((d) => (
              <label key={d} className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={decorations.includes(d)} onChange={() => toggle(d)}
                  className="mt-0.5 h-4 w-4 accent-black" />
                <span>
                  {t(`decoration.${d}.label`)}
                  <span className="block text-xs text-gray-400">{t(`decoration.${d}.hint`)}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400">{t("lessIsMore")}</p>
        </div>

        {decorations.includes("solvedac") && (
          <input value={solvedacId} onChange={(e) => setSolvedacId(e.target.value)} placeholder={t("solvedacPlaceholder")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        )}
        {decorations.includes("blog") && (
          <input value={blogRss} onChange={(e) => setBlogRss(e.target.value)} placeholder={t("blogPlaceholder")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        )}

        <div className="flex flex-wrap items-center gap-2">
          <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} aria-label={t("targetRole")}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">{t("targetRoleNone")}</option>
            {TARGET_ROLES.map((role) => <option key={role} value={tRole(role)}>{tRole(role)}</option>)}
          </select>
          <button type="button" onClick={generate} disabled={isGenerating || remaining === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">
            <Sparkles size={14} />
            {isGenerating ? t("generating") : draft ? t("regenerate") : t("generate")}
          </button>
          {remaining !== null && <span className="text-xs text-gray-500">{t("remaining", { count: remaining })}</span>}
        </div>
      </div>

      {draft && (
        <div className="rounded-2xl border border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-2">
            <div className="flex gap-1" role="tablist">
              {(["preview", "edit"] as const).map((m) => (
                <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
                  className={`rounded-md px-3 py-1 text-sm ${mode === m ? "bg-gray-100 font-semibold" : "text-gray-500"}`}>
                  {t(m)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 text-sm">
              {dirty && <button type="button" onClick={save} className="font-semibold text-gray-700 hover:text-black">{t("save")}</button>}
              <button type="button" onClick={() => copy(draft)} className="inline-flex items-center gap-1 font-semibold text-gray-700 hover:text-black">
                <Copy size={14} /> {t("copy")}
              </button>
              {login && (
                <a href={hasProfileReadme ? `https://github.com/${login}/${login}/edit/HEAD/README.md` : "https://github.com/new"}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-gray-700 hover:text-black">
                  <ExternalLink size={14} /> {hasProfileReadme ? t("openEditor") : t("createRepo", { login })}
                </a>
              )}
            </div>
          </div>
          {mode === "edit" ? (
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={18}
              className="w-full resize-y p-4 font-mono text-sm outline-none" aria-label={t("edit")} />
          ) : (
            <div className="p-5"><MarkdownPreview markdown={draft} /></div>
          )}
        </div>
      )}

      {draft && decorations.includes("blog") && blogRss.startsWith("https://") && (
        <div className="rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{t("workflowHeading")}</p>
            <button type="button" onClick={() => copy(blogWorkflowYaml(blogRss))}
              className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-black">
              <Copy size={14} /> {t("copy")}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">{t("workflowHint")}</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs">{blogWorkflowYaml(blogRss)}</pre>
        </div>
      )}

      {message && (
        <p role={message.kind === "error" ? "alert" : "status"}
          className={`text-sm ${message.kind === "error" ? "text-red-500" : "text-gray-600"}`}>
          {message.text}
        </p>
      )}
    </section>
  );
}
