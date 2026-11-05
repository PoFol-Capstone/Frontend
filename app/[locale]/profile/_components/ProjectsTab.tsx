"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, FolderGit2, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Skeleton } from "@/components/Skeleton";
import { deleteProject, getProject } from "@/lib/projects";
import { CARD_SLOTS, type Project, type ProjectSummary } from "@/types/project";
import { ConnectCard } from "./GitHubTab";
import ProjectList, { StageBadge } from "./ProjectList";
import ProjectCardEditor from "./ProjectCardEditor";
import RepoImportModal from "./RepoImportModal";

// 구현 설명 · 면접 연습 · 기술 추천은 S2 · S3에서 연다
const DETAIL_TABS = ["card", "explain", "interview", "techReco"] as const;
type DetailTab = (typeof DETAIL_TABS)[number];
const READY_TABS: DetailTab[] = ["card"];

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
    return <p role="alert" className="rounded-2xl border border-gray-200 p-10 text-center text-sm text-gray-500">{t("loadFailed")}</p>;
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
      <div className="rounded-2xl border border-gray-200 p-10 text-center">
        <FolderGit2 className="mx-auto mb-3 h-9 w-9 text-gray-400" />
        <p className="font-semibold">{t("emptyTitle")}</p>
        <p className="mt-1 text-sm text-gray-500">{t("emptyDesc")}</p>
        <button type="button" onClick={() => setImporting(true)}
          className="mt-4 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
          {t("import")}
        </button>
        {importModal}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <ProjectList projects={projects} selected={selected} onSelect={select} onImport={() => setImporting(true)} />
        {detail && (
          <>
            <StageBadge stage={detail.stage} />
            <span className="text-sm text-gray-500">{t("progress", { filled: detail.filledSlots, total: CARD_SLOTS.length })}</span>
            <div className="ml-auto flex items-center gap-3 text-sm">
              {detail.post && (
                <Link href={`/board/${detail.post.uuid}`} className="text-gray-500 hover:text-black">
                  {t("viewPost")}
                </Link>
              )}
              <a href={`https://github.com/${detail.repoFullName}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-gray-500 hover:text-black">
                GitHub <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button type="button" onClick={() => remove(detail)} aria-label={t("delete")}
                className="text-gray-400 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </header>

      <div className="min-w-0">
        {detail ? (
          <>
            <div role="tablist" aria-label={t("detailTabsLabel")} className="mb-5 flex gap-2 overflow-x-auto">
              {DETAIL_TABS.map((id) => {
                const ready = READY_TABS.includes(id);
                return (
                  <button key={id} type="button" role="tab" aria-selected={tab === id} disabled={!ready}
                    onClick={() => setTab(id)} title={ready ? undefined : t("comingSoon")}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition ${
                      tab === id ? "border-black bg-black text-white" : "border-gray-200 text-gray-600 hover:border-gray-400"
                    } disabled:cursor-not-allowed disabled:opacity-40`}>
                    {t(`tabs.${id}`)}
                  </button>
                );
              })}
            </div>

            {tab === "card" && <ProjectCardEditor project={detail} onSaved={applySaved} />}
          </>
        ) : detailError ? (
          <p role="alert" className="rounded-2xl border border-gray-200 p-10 text-center text-sm text-gray-500">{t("detailFailed")}</p>
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
