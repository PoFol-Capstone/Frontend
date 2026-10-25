"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Printer, Trash2, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Avatar } from "@/components/Avatar";
import { deleteResume, updateResume } from "@/lib/resume";
import { editSentence, newProject } from "@/lib/coachContent";
import type { Resume, ResumeContent, ResumeProject, Sentence, SentenceSource } from "@/types/resume";
import type { Profile } from "@/types/user";

// 인쇄(PDF 저장) 시 이 화면의 이력서 본문만 남긴다 — 별도 PDF 라이브러리 없이 브라우저 인쇄를 쓴다
const PRINT_CSS = `@media print {
  body * { visibility: hidden; }
  #resume-print, #resume-print * { visibility: visible; }
  #resume-print { position: absolute; inset: 0 auto auto 0; width: 100%; padding: 0; border: 0; }
  @page { margin: 16mm; }
}`;

const SOURCE_STYLE: Record<SentenceSource, string> = {
  VERIFIED: "bg-green-50 text-green-700",
  SELF: "bg-gray-100 text-gray-600",
  AI: "bg-violet-50 text-violet-700",
};

type Props = { initial: Resume; profile: Profile };

/** 3.7 이력서 편집 — 문장마다 출처 배지(검증됨/본인 작성/AI 작성), 고치면 본인 작성으로 바뀐다 */
export default function ResumeEditor({ initial, profile }: Props) {
  const t = useTranslations("resume.editor");
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState<ResumeContent>(initial.content);
  const [showPhoto, setShowPhoto] = useState(initial.showPhoto);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null);

  const updateProject = (index: number, change: (p: ResumeProject) => ResumeProject) =>
    setContent((c) => ({ ...c, projects: c.projects.map((p, i) => (i === index ? change(p) : p)) }));

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const res = await updateResume(initial.uuid, { title: title.trim() || initial.title, content, showPhoto });
    setSaving(false);
    setMessage(res.ok ? { kind: "info", text: t("saved") } : { kind: "error", text: res.error });
  };

  const remove = async () => {
    if (!window.confirm(t("deleteConfirm"))) return;
    const res = await deleteResume(initial.uuid);
    if (res.ok) router.push("/resume");
    else setMessage({ kind: "error", text: res.error });
  };

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <style>{PRINT_CSS}</style>

      {/* 편집 도구 — 인쇄에서는 숨겨진다 */}
      <div className="flex flex-wrap items-center gap-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} aria-label={t("title")}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showPhoto} onChange={(e) => setShowPhoto(e.target.checked)} className="h-4 w-4 accent-black" />
          {t("showPhoto")}
        </label>
        <button type="button" onClick={save} disabled={saving}
          className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">
          {saving ? t("saving") : t("save")}
        </button>
        <button type="button" onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50">
          <Printer size={14} /> {t("print")}
        </button>
        <button type="button" onClick={remove} aria-label={t("delete")} className="text-gray-400 hover:text-red-500">
          <Trash2 size={18} />
        </button>
      </div>
      <p className="text-xs text-gray-500">{t("legend")}</p>
      {message && (
        <p role={message.kind === "error" ? "alert" : "status"}
          className={`text-sm ${message.kind === "error" ? "text-red-500" : "text-gray-600"}`}>{message.text}</p>
      )}

      {/* 이력서 본문 (인쇄 대상) */}
      <article id="resume-print" className="space-y-8 rounded-2xl border border-gray-200 p-8">
        <header className="flex items-center gap-5">
          {showPhoto && <Avatar src={profile.avatarUrl} name={profile.name} size="lg" />}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <SentenceField sentence={content.headline} placeholder={t("headlinePlaceholder")} className="mt-2 text-base font-semibold"
              onChange={(s) => setContent((c) => ({ ...c, headline: s }))} />
          </div>
        </header>

        <section>
          <h2 className="mb-2 border-b border-gray-200 pb-1 text-sm font-bold uppercase tracking-wide text-gray-500">{t("summary")}</h2>
          <SentenceList items={content.summary} placeholder={t("summaryPlaceholder")}
            onChange={(summary) => setContent((c) => ({ ...c, summary }))} />
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between border-b border-gray-200 pb-1">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">{t("projects")}</h2>
            <button type="button" onClick={() => setContent((c) => ({ ...c, projects: [...c.projects, newProject()] }))}
              className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-black print:hidden">
              <Plus size={12} /> {t("addProject")}
            </button>
          </div>
          <div className="space-y-6">
            {content.projects.map((project, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-start gap-2">
                  <input value={project.name} onChange={(e) => updateProject(i, (p) => ({ ...p, name: e.target.value }))}
                    placeholder={t("projectName")} aria-label={t("projectName")}
                    className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none" />
                  {project.repoFullName && (
                    <a href={`https://github.com/${project.repoFullName}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-gray-500 underline">{project.repoFullName}</a>
                  )}
                  <button type="button" aria-label={t("removeProject")} className="text-gray-300 hover:text-red-500 print:hidden"
                    onClick={() => setContent((c) => ({ ...c, projects: c.projects.filter((_, j) => j !== i) }))}>
                    <X size={16} />
                  </button>
                </div>
                {project.facts.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5">
                    {project.facts.map((fact, j) => (
                      <li key={j} className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">✅ {fact.text}</li>
                    ))}
                  </ul>
                )}
                <SentenceField sentence={project.role} placeholder={t("rolePlaceholder")}
                  onChange={(role) => updateProject(i, (p) => ({ ...p, role }))} />
                <SentenceList items={project.highlights} placeholder={t("highlightPlaceholder")}
                  onChange={(highlights) => updateProject(i, (p) => ({ ...p, highlights }))} />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 border-b border-gray-200 pb-1 text-sm font-bold uppercase tracking-wide text-gray-500">{t("skills")}</h2>
          <input value={content.skills.join(", ")} aria-label={t("skills")}
            onChange={(e) => setContent((c) => ({ ...c, skills: e.target.value.split(",").map((s) => s.trimStart()) }))}
            onBlur={() => setContent((c) => ({ ...c, skills: c.skills.map((s) => s.trim()).filter(Boolean) }))}
            placeholder={t("skillsPlaceholder")} className="w-full bg-transparent text-sm outline-none" />
        </section>
      </article>
    </main>
  );
}

function SourceBadge({ source }: { source: SentenceSource }) {
  const t = useTranslations("resume.editor.source");
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${SOURCE_STYLE[source]} ${source === "VERIFIED" ? "" : "print:hidden"}`}>
      {t(source)}
    </span>
  );
}

function SentenceField({ sentence, onChange, placeholder, className = "" }: {
  sentence: Sentence;
  onChange: (next: Sentence) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <textarea
        value={sentence.text}
        onChange={(e) => onChange(editSentence(sentence, e.target.value))}
        placeholder={placeholder}
        rows={1}
        className={`min-w-0 flex-1 resize-none bg-transparent text-sm leading-6 outline-none [field-sizing:content] ${className}`}
      />
      {sentence.text && <SourceBadge source={sentence.source} />}
    </div>
  );
}

function SentenceList({ items, onChange, placeholder }: {
  items: Sentence[];
  onChange: (next: Sentence[]) => void;
  placeholder: string;
}) {
  const t = useTranslations("resume.editor");
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-1">
          <span className="pt-0.5 text-gray-400">•</span>
          <div className="min-w-0 flex-1">
            <SentenceField sentence={item} placeholder={placeholder}
              onChange={(next) => onChange(items.map((x, j) => (j === i ? next : x)))} />
          </div>
          <button type="button" aria-label={t("removeLine")} onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="pt-1 text-gray-300 hover:text-red-500 print:hidden">
            <X size={14} />
          </button>
        </li>
      ))}
      <li className="print:hidden">
        <button type="button" onClick={() => onChange([...items, { text: "", source: "SELF" }])}
          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-black">
          <Plus size={12} /> {t("addLine")}
        </button>
      </li>
    </ul>
  );
}
