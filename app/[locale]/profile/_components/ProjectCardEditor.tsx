"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Sparkles, X } from "lucide-react";
import { SourceBadge } from "@/components/SourceBadge";
import { updateCardSlot } from "@/lib/projects";
import { cleanFeatures, isSlotFilled, MAX_FEATURES, sameValue, type AiDraft } from "@/lib/projectCard";
import {
  CARD_SLOTS,
  PROBLEM_FIELDS,
  type CardSlot,
  type CardValue,
  type ProblemSolving,
  type Project,
  type ProjectFeature,
} from "@/types/project";

const INPUT = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black";

type Props = {
  project: Project;
  onSaved: (project: Project) => void;
};

/** 정리 카드 7칸 — 칸마다 따로 저장한다. 고친 칸은 출처가 ✏️ 본인 작성이 된다 */
export default function ProjectCardEditor({ project, onSaved }: Props) {
  const t = useTranslations("profile.projects.card.ai");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  // 프로젝트를 바꾸면 이전 프로젝트의 안내가 남지 않게 uuid와 함께 둔다
  const [ai, setAi] = useState<(Pick<AiDraft, "skipped" | "techCompare"> & { uuid: string }) | null>(null);
  const result = ai?.uuid === project.uuid ? ai : null;

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
      setAi({ uuid: project.uuid, skipped: data.skipped ?? {}, techCompare: data.techCompare ?? [] });
      onSaved(data.project);
    } catch {
      setAiError(t("failed"));
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-gray-50 p-4">
        <p className="mr-auto text-sm text-gray-600">{t("hint")}</p>
        <button type="button" onClick={generate} disabled={aiBusy}
          className="flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-40">
          <Sparkles className="h-4 w-4" /> {aiBusy ? t("running") : t("run")}
        </button>
        {aiError && <p role="alert" className="w-full text-sm text-red-500">{aiError}</p>}
      </div>
      {CARD_SLOTS.map((slot) => (
        <SlotEditor
          key={`${project.uuid}-${slot}`}
          uuid={project.uuid}
          slot={slot}
          saved={project.card[slot].value}
          source={project.card[slot].source}
          onSaved={onSaved}
          skipReason={result?.skipped[slot]}
          techCompare={slot === "techReasons" ? result?.techCompare : undefined}
        />
      ))}
    </div>
  );
}

function SlotEditor({ uuid, slot, saved, source, onSaved, skipReason, techCompare }: {
  uuid: string;
  slot: CardSlot;
  saved: CardValue<CardSlot>;
  source: Project["card"][CardSlot]["source"];
  onSaved: (project: Project) => void;
  /** AI가 근거를 못 찾아 비워 둔 칸 (이유가 없으면 빈 문자열) */
  skipReason?: string;
  techCompare?: AiDraft["techCompare"];
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
    <section className="rounded-2xl border border-gray-200 p-5">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-400">{CARD_SLOTS.indexOf(slot) + 1}</span>
        <h3 className="font-semibold">{t(`${slot}.title`)}</h3>
        {isSlotFilled(saved) && <SourceBadge source={source} />}
      </div>
      <p className="mb-3 text-sm text-gray-500">{t(`${slot}.hint`)}</p>

      {showSkip && (
        <div role="status" className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
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

      {slot === "features" ? (
        <FeaturesInput value={draft as ProjectFeature[]} onChange={setDraft} />
      ) : slot === "problemSolving" ? (
        <ProblemInput value={draft as ProblemSolving} onChange={setDraft} />
      ) : slot === "oneLiner" ? (
        <input value={draft as string} onChange={(e) => setDraft(e.target.value)} maxLength={200}
          aria-label={t(`${slot}.title`)} placeholder={t(`${slot}.placeholder`)} className={INPUT} />
      ) : (
        <textarea value={draft as string} onChange={(e) => setDraft(e.target.value)} maxLength={3000} rows={4}
          aria-label={t(`${slot}.title`)} placeholder={t(`${slot}.placeholder`)} className={`${INPUT} resize-y`} />
      )}

      <div className="mt-3 flex items-center justify-end gap-3">
        {error && <p role="alert" className="mr-auto text-sm text-red-500">{error}</p>}
        {dirty && !busy && (
          <button type="button" onClick={() => setDraft(saved)} className="text-sm text-gray-500 hover:text-black">
            {t("revert")}
          </button>
        )}
        <button type="button" onClick={save} disabled={!dirty || busy}
          className="rounded-lg bg-black px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-30">
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
        <div key={i} className="rounded-xl bg-gray-50 p-3">
          <div className="flex gap-2">
            <input value={f.name} onChange={(e) => update(i, { name: e.target.value })} maxLength={40}
              aria-label={t("name")} placeholder={t("name")} className={`${INPUT} bg-white`} />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}
              aria-label={t("remove")} className="text-gray-400 hover:text-black">
              <X className="h-4 w-4" />
            </button>
          </div>
          <textarea value={f.description} onChange={(e) => update(i, { description: e.target.value })} maxLength={500}
            rows={2} aria-label={t("description")} placeholder={t("description")}
            className={`${INPUT} mt-2 resize-y bg-white`} />
          {f.evidence.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {f.evidence.map((path) => (
                <code key={path} className="rounded bg-white px-1.5 py-0.5 text-[11px] text-gray-500">{path}</code>
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
    <div className="grid gap-3 sm:grid-cols-2">
      {PROBLEM_FIELDS.map((field) => (
        <label key={field} className="block text-sm">
          <span className="mb-1 block font-medium text-gray-600">{t(field)}</span>
          <textarea value={value[field]} onChange={(e) => onChange({ ...value, [field]: e.target.value })}
            maxLength={3000} rows={3} placeholder={t(`${field}Placeholder`)} className={`${INPUT} resize-y`} />
        </label>
      ))}
    </div>
  );
}
