"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, FileCode2, FolderTree, GitBranch, Lightbulb, Sparkles } from "lucide-react";
import { explainFeedbackPrompt } from "@/lib/feedbackPrompt";
import type { Project } from "@/types/project";
import FeedbackPromptButton from "./FeedbackPromptButton";

type Props = {
  project: Project;
  onSaved: (project: Project) => void;
};

/** 구현 설명 탭 — 핵심 파일 코드를 읽은 AI가 구조 · 요청 흐름 · 주요 파일 · 설계 선택을 설명한다 */
export default function ImplementationExplainer({ project, onSaved }: Props) {
  const t = useTranslations("profile.projects.explain");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const explain = project.assets?.explain;

  const generate = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/ai/project-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectUuid: project.uuid }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t("failed"));
        return;
      }
      if (data.unchanged) setNotice(t("unchanged"));
      onSaved(data.project);
    } catch {
      setError(t("failed"));
    } finally {
      setBusy(false);
    }
  };

  if (!explain) {
    return (
      <div className="card animate-fade-in-up p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
          <FolderTree className="h-7 w-7 text-gray-500" />
        </div>
        <p className="font-semibold">{t("emptyTitle")}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">{t("emptyDesc")}</p>
        <button type="button" onClick={generate} disabled={busy} className="btn btn-primary mt-6">
          <Sparkles className={`h-4 w-4 ${busy ? "animate-pulse" : ""}`} /> {busy ? t("running") : t("generate")}
        </button>
        {error && <p role="alert" className="mt-3 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  const { structure, flows, keyFiles, designChoices } = explain.data;

  return (
    <div className="space-y-6">
      <div className="flex animate-fade-in-up flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5">
        <p className="mr-auto text-[13px] text-gray-600">{t("hint")}</p>
        <button type="button" onClick={generate} disabled={busy} className="btn btn-secondary btn-sm">
          <Sparkles className={`h-4 w-4 ${busy ? "animate-pulse" : ""}`} /> {busy ? t("running") : t("regenerate")}
        </button>
        <FeedbackPromptButton buildPrompt={() => explainFeedbackPrompt(project)} />
        {notice && <p role="status" className="w-full text-sm text-gray-500">{notice}</p>}
        {error && <p role="alert" className="w-full text-sm text-red-500">{error}</p>}
      </div>

      {structure.length > 0 && (
        <section className="card animate-fade-in-up">
          <h3 className="mb-4 flex items-center gap-2 text-[17px] font-bold text-gray-900">
            <FolderTree className="h-4.5 w-4.5 text-gray-400" /> {t("structure")}
          </h3>
          <ul className="space-y-2">
            {structure.map((s) => (
              <li key={s.dir} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[12px] font-semibold text-gray-700">{s.dir}</code>
                <span className="text-gray-600">{s.role}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {flows.map((flow, fi) => (
        <section key={flow.name} className="card animate-fade-in-up" style={{ animationDelay: `${60 + fi * 60}ms` }}>
          <h3 className="mb-4 flex items-center gap-2 text-[17px] font-bold text-gray-900">
            <GitBranch className="h-4.5 w-4.5 text-gray-400" /> {t("flow", { name: flow.name })}
          </h3>
          <ol className="space-y-1">
            {flow.steps.map((step, i) => (
              <li key={`${step.path}-${i}`} className="text-sm">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-500">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-gray-800">{step.label}</p>
                    <code className="break-all text-[11px] text-gray-400">{step.path}</code>
                  </div>
                </div>
                {i < flow.steps.length - 1 && <ArrowDown className="ml-1.5 mt-1 h-3 w-3 text-gray-300" />}
              </li>
            ))}
          </ol>
        </section>
      ))}

      {keyFiles.length > 0 && (
        <section className="card animate-fade-in-up" style={{ animationDelay: "180ms" }}>
          <h3 className="mb-4 flex items-center gap-2 text-[17px] font-bold text-gray-900">
            <FileCode2 className="h-4.5 w-4.5 text-gray-400" /> {t("keyFiles")}
          </h3>
          <ul className="space-y-3">
            {keyFiles.map((k) => (
              <li key={k.path} className="rounded-xl border border-gray-100 p-3.5 text-sm">
                <a href={`https://github.com/${project.repoFullName}/blob/HEAD/${k.path}`} target="_blank"
                  rel="noopener noreferrer" className="break-all font-mono text-[12px] font-semibold text-gray-700 underline-offset-2 hover:underline">
                  {k.path}
                </a>
                <p className="mt-1 text-gray-600">{k.role}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {designChoices.length > 0 && (
        <section className="card animate-fade-in-up" style={{ animationDelay: "240ms" }}>
          <h3 className="mb-4 flex items-center gap-2 text-[17px] font-bold text-gray-900">
            <Lightbulb className="h-4.5 w-4.5 text-gray-400" /> {t("designChoices")}
          </h3>
          <ul className="space-y-4">
            {designChoices.map((d) => (
              <li key={d.topic} className="text-sm">
                <p className="font-semibold text-gray-800">
                  {d.topic}
                  {d.isGuess && (
                    <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                      {t("guessBadge")}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-gray-600">{d.claim}</p>
                {d.evidence.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {d.evidence.map((path) => (
                      <code key={path} className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">{path}</code>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
