"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ExternalLink, FolderGit2, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Skeleton } from "@/components/Skeleton";
import { deleteProject, getProject } from "@/lib/projects";
import { isSlotFilled } from "@/lib/projectCard";
import { CARD_SLOTS, type CardSlot, type Project, type ProjectSummary } from "@/types/project";
import { ConnectCard } from "./GitHubTab";
import ProjectList, { StageBadge } from "./ProjectList";
import ProjectCardEditor from "./ProjectCardEditor";
import ImplementationExplainer from "./ImplementationExplainer";
import InterviewPractice from "./InterviewPractice";
import TechRecommendations from "./TechRecommendations";
import RepoImportModal from "./RepoImportModal";

const DETAIL_TABS = ["card", "explain", "interview", "techReco"] as const;
type DetailTab = (typeof DETAIL_TABS)[number];

type Props = {
  connected: boolean;
  /** null이면 목록 조회 실패 */
  initialProjects: ProjectSummary[] | null;
  /** ?project= 로 들어오면 그 프로젝트를 먼저 연다 */
  initialProjectUuid: string | null;
};

const toSummary = (p: Project): ProjectSummary => ({
  uuid: p.uuid,
  repoFullName: p.repoFullName,
  stage: p.stage,
  filledSlots: p.filledSlots,
  displayOrder: p.displayOrder,
  updatedAt: p.updatedAt,
});

/** 프로필 — 내 프로젝트 탭: 왼쪽 목록 + 오른쪽 상세 (기획 5.1) */
export default function ProjectsTab({ connected, initialProjects, initialProjectUuid }: Props) {
  const t = useTranslations("profile.projects");
  const [projects, setProjects] = useState<ProjectSummary[]>(initialProjects ?? []);
  const [selected, setSelected] = useState<string | null>(
    initialProjects?.find((p) => p.uuid === initialProjectUuid)?.uuid ?? initialProjects?.[0]?.uuid ?? null,
  );
  const [detail, setDetail] = useState<Project | null>(null);
  const [detailError, setDetailError] = useState(false);
  const [importing, setImporting] = useState(false);
  const [tab, setTab] = useState<DetailTab>("card");

  // 선택이 바뀌면 상세를 다시 받는다 (방금 만든 프로젝트는 이미 detail에 있다)
  useEffect(() => {
    if (!selected || detail?.uuid === selected) return;
    let cancelled = false;
    getProject(selected).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setDetail(res.data);
        setDetailError(false);
      } else {
        setDetailError(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selected, detail?.uuid]);

  const select = (uuid: string) => {
    if (uuid === selected) return;
    setSelected(uuid);
    setDetail(null);
    setDetailError(false);
    setTab("card");
  };

  const applySaved = (project: Project) => {
    setDetail(project);
    setProjects((list) => list.map((p) => (p.uuid === project.uuid ? toSummary(project) : p)));
  };

  const onCreated = (project: Project) => {
    setImporting(false);
    setProjects((list) => [...list, toSummary(project)]);
    setDetail(project);
    setSelected(project.uuid);
    setTab("card");
  };

  const remove = async (project: Project) => {
    if (!window.confirm(t("deleteConfirm", { repo: project.repoFullName }))) return;
    const res = await deleteProject(project.uuid);
    if (!res.ok) {
      window.alert(t("deleteFailed"));
      return;
    }
    const rest = projects.filter((p) => p.uuid !== project.uuid);
    setProjects(rest);
    setDetail(null);
    setSelected(rest[0]?.uuid ?? null);
  };

  if (!connected && projects.length === 0) return <ConnectCard />;
  if (initialProjects === null) {
    return <p role="alert" className="card p-10 text-center text-sm text-gray-500">{t("loadFailed")}</p>;
  }

  const importModal = importing && (
    <RepoImportModal
      registered={projects.map((p) => p.repoFullName)}
      onCreated={onCreated}
      onClose={() => setImporting(false)}
    />
  );

  if (projects.length === 0) {
    return (
      <div className="card animate-fade-in-up p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
          <FolderGit2 className="h-7 w-7 text-gray-500" />
        </div>
        <p className="font-semibold">{t("emptyTitle")}</p>
        <p className="mt-1 text-sm text-gray-500">{t("emptyDesc")}</p>
        <button type="button" onClick={() => setImporting(true)}
          className="btn btn-primary mt-6">
          {t("import")}
        </button>
        {importModal}
      </div>
    );
  }

  const jumpTo = (slot: CardSlot) => {
    setTab("card");
    // 탭을 막 바꿨으면 칸이 그려진 뒤에 찾는다
    requestAnimationFrame(() => {
      const el = document.getElementById(`slot-${slot}`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.querySelector<HTMLElement>("input, textarea")?.focus({ preventScroll: true });
    });
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="card mb-6 animate-fade-in-up !p-5 md:!p-6">
        <div className="flex flex-wrap items-center gap-3">
          <ProjectList projects={projects} selected={selected} onSelect={select} onImport={() => setImporting(true)} />
          {detail && <StageBadge stage={detail.stage} />}
          {detail && (
            <div className="ml-auto flex items-center gap-1 text-sm">
              {detail.post && (
                <Link href={`/board/${detail.post.uuid}`}
                  className="rounded-full px-3 py-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-black">
                  {t("viewPost")}
                </Link>
              )}
              <a href={`https://github.com/${detail.repoFullName}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-black">
                GitHub <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button type="button" onClick={() => remove(detail)} aria-label={t("delete")}
                className="rounded-full p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        {detail && (
          <div className="mt-4 flex items-start gap-3">
            {/* 칸마다 칩 하나 — 안 쓴 칸이 눈에 띄고, 누르면 그 칸으로 간다 */}
            <div className="flex flex-1 flex-wrap gap-1.5">
              {CARD_SLOTS.map((slot, i) => {
                const filled = isSlotFilled(detail.card[slot].value);
                const title = t(`card.${slot}.title`);
                return (
                  <button key={slot} type="button" onClick={() => jumpTo(slot)}
                    aria-label={`${title} — ${t(filled ? "slotFilled" : "slotEmpty")}`}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition ${
                      filled
                        ? "bg-gray-100 text-gray-400 hover:text-black"
                        : "border border-dashed border-gray-400 font-medium text-gray-900 hover:border-black hover:bg-gray-50"
                    }`}>
                    {filled ? <Check className="h-3 w-3" /> : <span className="tabular-nums">{i + 1}</span>}
                    {title}
                  </button>
                );
              })}
            </div>
            <span className="shrink-0 pt-1 text-xs font-medium tabular-nums text-gray-500">
              {t("progress", { filled: detail.filledSlots, total: CARD_SLOTS.length })}
            </span>
          </div>
        )}
      </header>

      <div className="min-w-0">
        {detail ? (
          <div key={detail.uuid}>
            <div role="tablist" aria-label={t("detailTabsLabel")}
              className="mb-6 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-gray-100 p-1">
              {DETAIL_TABS.map((id) => (
                <button key={id} type="button" role="tab" aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                    tab === id ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"
                  }`}>
                  {t(`tabs.${id}`)}
                </button>
              ))}
            </div>

            {tab === "card" && <ProjectCardEditor project={detail} onSaved={applySaved} />}
            {tab === "explain" && <ImplementationExplainer project={detail} onSaved={applySaved} />}
            {tab === "interview" && <InterviewPractice project={detail} onSaved={applySaved} />}
            {tab === "techReco" && <TechRecommendations project={detail} onSaved={applySaved} />}
          </div>
        ) : detailError ? (
          <p role="alert" className="card animate-fade-in-up p-10 text-center text-sm text-gray-500">{t("detailFailed")}</p>
        ) : (
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-9 w-80" />
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}
          </div>
        )}
      </div>
      {importModal}
    </div>
  );
}
