"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { CARD_SLOTS, type ProjectStage, type ProjectSummary } from "@/types/project";

const STAGE_STYLE: Record<ProjectStage, string> = {
  REGISTERED: "bg-gray-100 text-gray-500",
  DRAFT: "bg-amber-50 text-amber-700",
  ORGANIZED: "bg-blue-50 text-blue-700",
  INTERVIEW_READY: "bg-green-50 text-green-700",
};

export function StageBadge({ stage }: { stage: ProjectStage }) {
  const t = useTranslations("profile.projects.stage");
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STAGE_STYLE[stage]}`}>
      {t(stage)}
    </span>
  );
}

/** "owner/repo" → "repo" (목록은 좁아서 레포 이름만) */
export function repoName(fullName: string): string {
  return fullName.slice(fullName.indexOf("/") + 1);
}

type Props = {
  projects: ProjectSummary[];
  selected: string | null;
  onSelect: (uuid: string) => void;
  onImport: () => void;
};

/** 제목 자리의 프로젝트 전환 토글(진행도 채운 칸/7) + 새 프로젝트 추가 버튼 */
export default function ProjectList({ projects, selected, onSelect, onImport }: Props) {
  const t = useTranslations("profile.projects");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = projects.find((p) => p.uuid === selected);

  // 바깥 클릭 · Esc로 닫는다
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div ref={ref} className="relative min-w-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={t("listLabel")}
          className="group flex min-w-0 items-center gap-1.5 rounded-lg px-1.5 py-1 -mx-1.5 text-xl font-bold tracking-tight transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
        >
          <span className="truncate">{current ? repoName(current.repoFullName) : t("listLabel")}</span>
          <ChevronDown className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 group-hover:text-black ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <ul
            role="listbox"
            aria-label={t("listLabel")}
            className="absolute left-0 top-full z-30 mt-2 max-h-80 w-72 max-w-[calc(100vw-3rem)] animate-fade-in-up overflow-y-auto rounded-2xl border border-gray-200 bg-white p-1.5 shadow-lg"
          >
            {projects.map((p) => {
              const active = p.uuid === selected;
              return (
                <li key={p.uuid} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onSelect(p.uuid);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      active ? "bg-gray-100" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{repoName(p.repoFullName)}</span>
                        <StageBadge stage={p.stage} />
                      </div>
                      {/* 채운 칸 진행도 */}
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-200">
                          <div className="h-full rounded-full bg-black transition-[width]"
                            style={{ width: `${(p.filledSlots / CARD_SLOTS.length) * 100}%` }} />
                        </div>
                        <span className="text-[11px] tabular-nums text-gray-500">
                          {p.filledSlots}/{CARD_SLOTS.length}
                        </span>
                      </div>
                    </div>
                    <Check className={`h-4 w-4 shrink-0 ${active ? "text-black" : "invisible"}`} />
                  </button>
                </li>
              );
            })}
            <li className="mt-1 border-t border-gray-100 pt-1">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onImport();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-gray-500 transition hover:bg-gray-50 hover:text-black"
              >
                <Plus className="h-4 w-4" />
                {t("import")}
              </button>
            </li>
          </ul>
        )}
      </div>
      <button
        type="button"
        onClick={onImport}
        aria-label={t("import")}
        title={t("import")}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition hover:border-black hover:text-black"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
