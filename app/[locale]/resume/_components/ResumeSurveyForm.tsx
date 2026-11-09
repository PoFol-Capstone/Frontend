"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { createResume } from "@/lib/resume";
import { emptyResumeContent } from "@/lib/coachContent";
import type { ResumeContent, ResumeSurvey } from "@/types/resume";
import Field from "@/components/ui/Field";
import Section from "@/components/ui/Section";

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

  return (
    <Section card title={t("heading")} description={t("desc")}>
      <Field label={t("title")}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100}
          placeholder={t("titlePlaceholder")} className="input" />
      </Field>
      <Field label={t("targetRole")}>
        <input value={survey.targetRole} onChange={set("targetRole")} maxLength={50} className="input"
          placeholder={t("targetRolePlaceholder")} />
      </Field>
      <Field label={t("interests")}>
        <input value={survey.interests} onChange={set("interests")} maxLength={200} className="input"
          placeholder={t("interestsPlaceholder")} />
      </Field>
      <Field label={t("teamRole")}>
        <input value={survey.teamRole} onChange={set("teamRole")} maxLength={200} className="input"
          placeholder={t("teamRolePlaceholder")} />
      </Field>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-gray-900">{t("strengths")}</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {survey.strengths.map((value, i) => (
            <input key={i} value={value} maxLength={30} aria-label={t("strengthN", { n: i + 1 })}
              onChange={(e) => setSurvey((s) => ({ ...s, strengths: s.strengths.map((x, j) => (j === i ? e.target.value : x)) }))}
              className="input" />
          ))}
        </div>
      </fieldset>
      <Field label={t("goal")}>
        <input value={survey.goal} onChange={set("goal")} maxLength={200} className="input"
          placeholder={t("goalPlaceholder")} />
      </Field>

      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={generate} disabled={busy !== null} className="btn btn-primary">
          <Sparkles size={16} /> {busy === "ai" ? t("generating") : t("generate")}
        </button>
        <button type="button" onClick={startBlank} disabled={busy !== null} className="btn btn-secondary">
          {t("blank")}
        </button>
      </div>
      <p className="text-[13px] text-gray-400">{t("aiNotice")}</p>
    </Section>
  );
}
