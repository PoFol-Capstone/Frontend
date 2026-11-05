"use client";

import { useTranslations } from "next-intl";
import { ChevronDown, Plus } from "lucide-react";
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
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="relative min-w-0">
        <select
          value={selected ?? ""}
          onChange={(e) => onSelect(e.target.value)}
          aria-label={t("listLabel")}
          className="w-full min-w-0 cursor-pointer appearance-none truncate rounded-lg bg-transparent py-1 pr-8 text-2xl font-bold hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
        >
          {projects.map((p) => (
            <option key={p.uuid} value={p.uuid} className="text-base font-normal">
              {repoName(p.repoFullName)} ({p.filledSlots}/{CARD_SLOTS.length})
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
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
