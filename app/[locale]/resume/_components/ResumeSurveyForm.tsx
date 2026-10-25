"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { createResume } from "@/lib/resume";
import { emptyResumeContent } from "@/lib/coachContent";
import type { ResumeContent, ResumeSurvey } from "@/types/resume";

const EMPTY_SURVEY: ResumeSurvey = { targetRole: "", interests: "", teamRole: "", strengths: ["", "", ""], goal: "" };

/** 1분 설문(5문항) → AI 초안 → 저장 후 편집 화면으로. AI 없이 빈 이력서로 시작할 수도 있다 */
export default function ResumeSurveyForm() {
  const t = useTranslations("resume.survey");
  const router = useRouter();
  const [survey, setSurvey] = useState<ResumeSurvey>(EMPTY_SURVEY);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState<"ai" | "blank" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof Omit<ResumeSurvey, "strengths">) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setSurvey((s) => ({ ...s, [field]: e.target.value }));

  const save = async (content: ResumeContent) => {
    const res = await createResume({
      title: title.trim() || t("defaultTitle", { role: survey.targetRole || "-" }),
      survey: { ...survey, strengths: survey.strengths.filter((s) => s.trim()) },
      content,
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(`/resume/${res.data.uuid}`);
  };

  const generate = async () => {
    if (!survey.targetRole.trim()) {
      setError(t("targetRoleRequired"));
      return;
    }
    setBusy("ai");
    setError(null);
    try {
      const res = await fetch("/api/ai/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ survey: { ...survey, strengths: survey.strengths.filter((s) => s.trim()) } }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t("aiFailed"));
        return;
      }
      await save(data.content as ResumeContent);
    } catch {
      setError(t("aiFailed"));
    } finally {
      setBusy(null);
    }
  };

  const startBlank = async () => {
    setBusy("blank");
    setError(null);
    try {
      await save(emptyResumeContent());
    } finally {
      setBusy(null);
    }
  };

  const inputClass = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black";

  return (
    <section className="space-y-5 rounded-2xl border border-gray-200 p-6">
      <div>
        <h2 className="text-lg font-semibold">{t("heading")}</h2>
        <p className="mt-1 text-sm text-gray-500">{t("desc")}</p>
      </div>

      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">{t("title")}</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100}
          placeholder={t("titlePlaceholder")} className={inputClass} />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">{t("targetRole")}</span>
        <input value={survey.targetRole} onChange={set("targetRole")} maxLength={50} className={inputClass}
          placeholder={t("targetRolePlaceholder")} />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">{t("interests")}</span>
        <input value={survey.interests} onChange={set("interests")} maxLength={200} className={inputClass}
          placeholder={t("interestsPlaceholder")} />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">{t("teamRole")}</span>
        <input value={survey.teamRole} onChange={set("teamRole")} maxLength={200} className={inputClass}
          placeholder={t("teamRolePlaceholder")} />
      </label>
      <fieldset className="text-sm">
        <legend className="mb-1.5 font-medium">{t("strengths")}</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {survey.strengths.map((value, i) => (
            <input key={i} value={value} maxLength={30} aria-label={t("strengthN", { n: i + 1 })}
              onChange={(e) => setSurvey((s) => ({ ...s, strengths: s.strengths.map((x, j) => (j === i ? e.target.value : x)) }))}
              className={inputClass} />
          ))}
        </div>
      </fieldset>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">{t("goal")}</span>
        <input value={survey.goal} onChange={set("goal")} maxLength={200} className={inputClass}
          placeholder={t("goalPlaceholder")} />
      </label>

      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={generate} disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">
          <Sparkles size={14} /> {busy === "ai" ? t("generating") : t("generate")}
        </button>
        <button type="button" onClick={startBlank} disabled={busy !== null}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          {t("blank")}
        </button>
      </div>
      <p className="text-xs text-gray-400">{t("aiNotice")}</p>
    </section>
  );
}
