"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronDown, ChevronRight, MessageCircleQuestion, Sparkles } from "lucide-react";
import { interviewFeedbackPrompt } from "@/lib/feedbackPrompt";
import { practiceOrder } from "@/lib/projectAssets";
import { recordInterviewPractice } from "@/lib/projects";
import type { InterviewQuestion, Project } from "@/types/project";
import FeedbackPromptButton from "./FeedbackPromptButton";

const PAGE = 5;

type Props = {
  project: Project;
  onSaved: (project: Project) => void;
};

/** 면접 연습 탭 — 내 코드 · 커밋 근거 질문 5개씩, 답을 쓰고 "좋은 답의 요소"와 비교한다. 채점 없음 */
export default function InterviewPractice({ project, onSaved }: Props) {
  const t = useTranslations("profile.projects.interview");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const interview = project.assets?.interview;

  const generate = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/ai/interview-questions", {
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
      setPage(0);
      onSaved(data.project);
    } catch {
      setError(t("failed"));
    } finally {
      setBusy(false);
    }
  };

  if (!interview || interview.questions.length === 0) {
    const noMyCommits = (project.assets?.hints?.skipped?.myRole ?? null) !== null;
    return (
      <div className="card animate-fade-in-up p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
          <MessageCircleQuestion className="h-7 w-7 text-gray-500" />
        </div>
        <p className="font-semibold">{t("emptyTitle")}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">{t("emptyDesc")}</p>
        {noMyCommits && <p className="mt-2 text-xs text-amber-700">{t("emailGuide")}</p>}
        <button type="button" onClick={generate} disabled={busy} className="btn btn-primary mt-6">
          <Sparkles className={`h-4 w-4 ${busy ? "animate-pulse" : ""}`} /> {busy ? t("running") : t("generate")}
        </button>
        {error && <p role="alert" className="mt-3 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  const ordered = practiceOrder(interview.questions);
  const start = (page * PAGE) % ordered.length;
  const visible = ordered.slice(start, start + PAGE);
  const practiced = interview.questions.filter((q) => q.practicedAt).length;

  return (
    <div className="space-y-6">
      <div className="flex animate-fade-in-up flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5">
        <p className="mr-auto text-[13px] text-gray-600">
          {t("progress", { practiced, total: interview.questions.length })}
          <span className="block text-xs text-gray-400">{t("noGrading")}</span>
        </p>
        <button type="button" onClick={() => setPage((p) => p + 1)} className="btn btn-secondary btn-sm">
          {t("next5")}
        </button>
        <button type="button" onClick={generate} disabled={busy} className="btn btn-secondary btn-sm">
          <Sparkles className={`h-4 w-4 ${busy ? "animate-pulse" : ""}`} /> {busy ? t("running") : t("regenerate")}
        </button>
        {practiced > 0 && <FeedbackPromptButton buildPrompt={() => interviewFeedbackPrompt(project)} />}
        {notice && <p role="status" className="w-full text-sm text-gray-500">{notice}</p>}
        {error && <p role="alert" className="w-full text-sm text-red-500">{error}</p>}
      </div>

      {visible.map((q, i) => (
        <QuestionCard key={q.id} index={i} question={q} project={project} onSaved={onSaved} />
      ))}

      {interview.themeSources && interview.themeSources.length > 0 && (
        <p className="text-xs text-gray-400">
          {t("sources")}{" "}
          {interview.themeSources.map((s, i) => (
            <span key={s.repo}>
              {i > 0 && " · "}
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
                {s.repo}
              </a>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

function QuestionCard({ index, question: q, project, onSaved }: {
  index: number;
  question: InterviewQuestion;
  project: Project;
  onSaved: (project: Project) => void;
}) {
  const t = useTranslations("profile.projects.interview");
  const [answer, setAnswer] = useState(q.answer ?? "");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    const res = await recordInterviewPractice(project.uuid, q.id, answer);
    setBusy(false);
    if (!res.ok) {
      setError(res.error || t("saveFailed"));
      return;
    }
    onSaved(res.data);
  };

  return (
    <section className="card animate-fade-in-up" style={{ animationDelay: `${60 + index * 60}ms` }}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-gray-900 px-2.5 py-0.5 text-[11px] font-medium text-white">
          {t(`types.${q.type}`)}
        </span>
        {q.theme && (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] text-gray-600">{q.theme}</span>
        )}
        {q.practicedAt && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] text-emerald-700">
            <Check className="h-3 w-3" /> {t("practiced")}
          </span>
        )}
      </div>
      <h3 className="text-[16px] font-bold leading-snug text-gray-900">{q.question}</h3>

      {(q.evidence.paths.length > 0 || q.evidence.commit) && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <span className="text-[11px] text-gray-400">{t("evidence")}</span>
          {q.evidence.paths.map((path) => (
            <a key={path} href={`https://github.com/${project.repoFullName}/blob/HEAD/${path}`} target="_blank"
              rel="noopener noreferrer"
              className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-500 hover:text-black">
              {path}
            </a>
          ))}
          {q.evidence.commit && (
            <a href={`https://github.com/${project.repoFullName}/commit/${q.evidence.commit}`} target="_blank"
              rel="noopener noreferrer"
              className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-500 hover:text-black">
              {q.evidence.commit.slice(0, 7)}
            </a>
          )}
        </div>
      )}

      <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} maxLength={3000} rows={3}
        aria-label={t("answerLabel")} placeholder={t("answerPlaceholder")}
        className="input mt-4 h-auto min-h-24 w-full resize-none border-transparent bg-gray-50 py-3 text-[15px] leading-7 field-sizing-content hover:border-transparent focus:border-gray-200 focus:bg-white" />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />} {t("goodAnswer")}
        </button>
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
        <button type="button" onClick={save} disabled={busy || answer.trim() === "" || answer === (q.answer ?? "")}
          className="btn btn-primary btn-sm ml-auto">
          {busy ? t("saving") : t("saveAnswer")}
        </button>
      </div>
      {open && (
        <ul className="mt-3 list-disc space-y-1 rounded-lg bg-gray-50 py-3 pl-8 pr-3 text-sm text-gray-600">
          {q.goodAnswerPoints.map((p) => <li key={p}>{p}</li>)}
        </ul>
      )}
    </section>
  );
}
