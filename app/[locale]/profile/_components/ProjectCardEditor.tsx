"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Plus, ScanSearch, Sparkles, X } from "lucide-react";
import { SourceBadge } from "@/components/SourceBadge";
import { cardFeedbackPrompt } from "@/lib/feedbackPrompt";
import { fillCardFacts, updateCardSlot } from "@/lib/projects";
import FeedbackPromptButton from "./FeedbackPromptButton";
import { cleanFeatures, isSlotFilled, MAX_FEATURES, sameValue } from "@/lib/projectCard";
import {
  CARD_SLOTS,
  PROBLEM_FIELDS,
  type CardHints,
  type CardSlot,
  type CardValue,
  type ProblemSolving,
  type Project,
  type ProjectFeature,
} from "@/types/project";

// 입력란을 상자 대신 글 영역처럼 — 테두리·리사이즈 손잡이 없이 내용 따라 늘어난다
const FIELD =
  "input h-auto border-transparent bg-gray-50 py-3 text-[15px] leading-7 hover:border-transparent focus:border-gray-200 focus:bg-white";
const AREA = `${FIELD} min-h-24 resize-none field-sizing-content`;

type Props = {
  project: Project;
  onSaved: (project: Project) => void;
};

/** 정리 카드 7칸 — 칸마다 따로 저장한다. 고친 칸은 출처가 본인 작성이 된다 */
export default function ProjectCardEditor({ project, onSaved }: Props) {
  const t = useTranslations("profile.projects.card.ai");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  // AI 보조 정보(비운 이유 · 비교 기술 · 회고 질문)는 백엔드 assets.hints에 저장돼 새로고침해도 남는다
  const hints: CardHints = project.assets?.hints ?? {};

  const [factsBusy, setFactsBusy] = useState(false);
  // AI 없이 레포에서 확인한 사실만 채운다 — AI 초안보다 먼저 권한다 (ppt/v6-plan.md 4.4)
  const fillFacts = async () => {
    setFactsBusy(true);
    setAiError(null);
    const res = await fillCardFacts(project.uuid);
    if (res.ok) onSaved(res.data);
    else setAiError(res.error || t("failed"));
    setFactsBusy(false);
  };

  const generate = async () => {
    setAiBusy(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/project-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectUuid: project.uuid }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAiError(data.error ?? t("failed"));
        return;
      }
      onSaved(data.project);
    } catch {
      setAiError(t("failed"));
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex animate-fade-in-up flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5">
        <p className="mr-auto flex items-center gap-2 text-[13px] text-gray-600">
          <Sparkles className="h-4 w-4 shrink-0 text-gray-400" /> {t("hint")}
          <span className="block w-full text-xs text-gray-400">{t("codeNotice")}</span>
        </p>
        <button type="button" onClick={fillFacts} disabled={factsBusy || aiBusy}
          className="btn btn-primary btn-sm">
          <ScanSearch className={`h-4 w-4 ${factsBusy ? "animate-pulse" : ""}`} /> {factsBusy ? t("running") : t("facts")}
        </button>
        <button type="button" onClick={generate} disabled={aiBusy || factsBusy}
          className="btn btn-secondary btn-sm">
          <Sparkles className={`h-4 w-4 ${aiBusy ? "animate-pulse" : ""}`} /> {aiBusy ? t("running") : t("run")}
        </button>
        {project.filledSlots > 0 && <FeedbackPromptButton buildPrompt={() => cardFeedbackPrompt(project)} />}
        {aiError && <p role="alert" className="w-full text-sm text-red-500">{aiError}</p>}
      </div>
      {aiBusy && (
        <div role="status" aria-live="polite"
          className="fixed inset-0 z-50 flex animate-fade-in-up flex-col items-center justify-center gap-5 bg-white/75 px-6 text-center backdrop-blur-sm">
          <div className="relative h-24 w-20">
            {/* 옅은 실루엣 위로 진한 실루엣이 차오른다 */}
            <Image src="/brand/pofol-symbol.png" alt="" fill sizes="80px" className="object-contain opacity-15 brightness-0" />
            <Image src="/brand/pofol-symbol.png" alt="" fill sizes="80px" className="animate-fill-up object-contain" />
          </div>
          <div className="space-y-1.5">
            <p className="text-base font-semibold text-gray-900">{t("running")}</p>
            <p className="text-sm text-gray-500">{t("wait")}</p>
          </div>
        </div>
      )}
      {CARD_SLOTS.map((slot, i) => (
        <SlotEditor
          index={i}
          key={`${project.uuid}-${slot}`}
          uuid={project.uuid}
          slot={slot}
          saved={project.card[slot].value}
          source={project.card[slot].source}
          onSaved={onSaved}
          skipReason={hints.skipped?.[slot]}
          techCompare={slot === "techReasons" ? hints.techCompare : undefined}
          retroQuestions={slot === "retrospective" ? hints.retroQuestions : undefined}
          commitUrl={
            slot === "problemSolving" && hints.problemCommit
              ? `https://github.com/${project.repoFullName}/commit/${hints.problemCommit}`
              : undefined
          }
        />
      ))}
    </div>
  );
}

function SlotEditor({ index, uuid, slot, saved, source, onSaved, skipReason, techCompare, retroQuestions, commitUrl }: {
  index: number;
  uuid: string;
  slot: CardSlot;
  saved: CardValue<CardSlot>;
  source: Project["card"][CardSlot]["source"];
  onSaved: (project: Project) => void;
  /** AI가 근거를 못 찾아 비워 둔 칸 (이유가 없으면 빈 문자열) */
  skipReason?: string;
  techCompare?: CardHints["techCompare"];
  /** 회고가 비었을 때 스스로 답해 볼 질문 */
  retroQuestions?: string[];
  /** 문제 해결의 근거 커밋 링크 */
  commitUrl?: string;
}) {
  const t = useTranslations("profile.projects.card");
  const [draft, setDraft] = useState<CardValue<CardSlot>>(saved);
  const [base, setBase] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // AI 초안처럼 밖에서 저장값이 바뀌면, 고치던 중이 아닐 때만 입력란에 반영한다
  if (!sameValue(base, saved)) {
    setBase(saved);
    if (sameValue(draft, base)) setDraft(saved);
  }
  const dirty = !sameValue(draft, saved);
  const showSkip = skipReason !== undefined && !isSlotFilled(saved);

  const save = async () => {
    setBusy(true);
    setError(null);
    const value = Array.isArray(draft) ? cleanFeatures(draft) : draft;
    const res = await updateCardSlot(uuid, slot, value);
    setBusy(false);
    if (!res.ok) {
      setError(res.status === 400 && res.error ? res.error : t("saveFailed"));
      return;
    }
    setDraft(res.data.card[slot].value);
    onSaved(res.data);
  };

  return (
    <section id={`slot-${slot}`} style={{ animationDelay: `${80 + index * 60}ms` }}
      className={`card scroll-mt-24 animate-fade-in-up transition-[border-color,box-shadow] duration-300 hover:shadow-sm ${
        dirty ? "border-gray-400" : "hover:border-gray-300"
      }`}>
      <div className="mb-1 flex items-center gap-2.5">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-300 ${
          isSlotFilled(saved) ? "bg-black text-white" : "bg-gray-100 text-gray-400"
        }`}>{index + 1}</span>
        <h3 className="text-[17px] font-bold tracking-tight text-gray-900">{t(`${slot}.title`)}</h3>
        {isSlotFilled(saved) && <SourceBadge source={source} />}
      </div>
      <p className="mb-5 pl-8.5 text-[13px] leading-relaxed text-gray-500">{t(`${slot}.hint`)}</p>

      {showSkip && (
        <div role="status" className="mb-3 animate-fade-in-up rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t("ai.skipped")}
          {skipReason && <span className="block text-xs text-amber-700">{skipReason}</span>}
        </div>
      )}
      {showSkip && techCompare && techCompare.length > 0 && (
        <div className="mb-3 rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <p className="mb-1 font-medium text-gray-700">{t("ai.compareTitle")}</p>
          <ul className="space-y-1 text-gray-600">
            {techCompare.map((c) => (
              <li key={c.tech}>
                <b>{c.tech}</b> vs {c.alternatives.join(" · ")}
                {c.question && <span className="block text-xs text-gray-500">{c.question}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {showSkip && retroQuestions && retroQuestions.length > 0 && (
        <div className="mb-3 rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <p className="mb-1 font-medium text-gray-700">{t("ai.retroTitle")}</p>
          <ul className="list-disc space-y-1 pl-4 text-gray-600">
            {retroQuestions.map((q) => <li key={q}>{q}</li>)}
          </ul>
        </div>
      )}
      {commitUrl && isSlotFilled(saved) && (
        <p className="mb-3 text-xs text-gray-500">
          {t("ai.problemEvidence")}{" "}
          <a href={commitUrl} target="_blank" rel="noopener noreferrer"
            className="font-mono text-gray-600 underline hover:text-black">
            {commitUrl.split("/").pop()?.slice(0, 7)}
          </a>
        </p>
      )}

      {slot === "features" ? (
        <FeaturesInput value={draft as ProjectFeature[]} onChange={setDraft} />
      ) : slot === "problemSolving" ? (
        <ProblemInput value={draft as ProblemSolving} onChange={setDraft} />
      ) : slot === "oneLiner" ? (
        <input value={draft as string} onChange={(e) => setDraft(e.target.value)} maxLength={200}
          aria-label={t(`${slot}.title`)} placeholder={t(`${slot}.placeholder`)} className={`${FIELD} h-12 py-0`} />
      ) : (
        <textarea value={draft as string} onChange={(e) => setDraft(e.target.value)} maxLength={3000} rows={3}
          aria-label={t(`${slot}.title`)} placeholder={t(`${slot}.placeholder`)} className={AREA} />
      )}

      <div className="mt-4 flex items-center justify-end gap-3">
        {error && <p role="alert" className="mr-auto text-sm text-red-500">{error}</p>}
        {dirty && !busy && (
          <button type="button" onClick={() => setDraft(saved)} className="text-sm text-gray-500 hover:text-black">
            {t("revert")}
          </button>
        )}
        <button type="button" onClick={save} disabled={!dirty || busy}
          className="btn btn-primary btn-sm">
          {busy ? t("saving") : t("save")}
        </button>
      </div>
    </section>
  );
}

function FeaturesInput({ value, onChange }: { value: ProjectFeature[]; onChange: (v: ProjectFeature[]) => void }) {
  const t = useTranslations("profile.projects.card.features");
  const update = (i: number, patch: Partial<ProjectFeature>) =>
    onChange(value.map((f, j) => (j === i ? { ...f, ...patch } : f)));

  return (
    <div className="space-y-3">
      {value.map((f, i) => (
        <div key={i} className="animate-fade-in-up rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2">
            <input value={f.name} onChange={(e) => update(i, { name: e.target.value })} maxLength={40}
              aria-label={t("name")} placeholder={t("name")} className={`${FIELD} h-11 min-w-0 flex-1 py-0 font-semibold`} />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}
              aria-label={t("remove")} className="shrink-0 p-1 text-gray-400 hover:text-black">
              <X className="h-4 w-4" />
            </button>
          </div>
          <textarea value={f.description} onChange={(e) => update(i, { description: e.target.value })} maxLength={500}
            rows={2} aria-label={t("description")} placeholder={t("description")}
            className={`${AREA} mt-2 min-h-16`} />
          {f.evidence.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {f.evidence.map((path) => (
                <code key={path} className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">{path}</code>
              ))}
            </div>
          )}
        </div>
      ))}
      {value.length < MAX_FEATURES && (
        <button type="button" onClick={() => onChange([...value, { name: "", description: "", evidence: [] }])}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-black">
          <Plus className="h-4 w-4" /> {t("add")}
        </button>
      )}
    </div>
  );
}

function ProblemInput({ value, onChange }: { value: ProblemSolving; onChange: (v: ProblemSolving) => void }) {
  const t = useTranslations("profile.projects.card.problemSolving");
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {PROBLEM_FIELDS.map((field) => (
        <label key={field} className="block">
          <span className="mb-2 block text-[13px] font-semibold text-gray-700">{t(field)}</span>
          <textarea value={value[field]} onChange={(e) => onChange({ ...value, [field]: e.target.value })}
            maxLength={3000} rows={3} placeholder={t(`${field}Placeholder`)} className={AREA} />
        </label>
      ))}
    </div>
  );
}
