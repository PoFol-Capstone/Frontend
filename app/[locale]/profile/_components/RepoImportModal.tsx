"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/Modal";
import { Skeleton } from "@/components/Skeleton";
import { createProject, getMyGitHubRepos } from "@/lib/projects";
import type { GitHubRepoOption, Project } from "@/types/project";

// 백엔드 GitHubService.REPO_FULL_NAME과 같은 형식
const REPO_FULL_NAME = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;

type Props = {
  /** 이미 등록한 레포 (소문자 비교) — 목록에서 비활성 */
  registered: string[];
  onCreated: (project: Project) => void;
  onClose: () => void;
};

/**
 * 레포 가져오기 — 내 GitHub 레포 목록에서 고르거나, 팀원 · 조직 소유의 공개 레포는 "owner/repo"로 직접 입력한다.
 * (내 레포 목록 API는 내가 소유한 레포만 준다)
 */
export default function RepoImportModal({ registered, onCreated, onClose }: Props) {
  const t = useTranslations("profile.projects.importModal");
  const [repos, setRepos] = useState<GitHubRepoOption[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyGitHubRepos().then((res) => {
      if (cancelled) return;
      if (res.ok) setRepos(res.data);
      else setLoadError(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const taken = useMemo(() => new Set(registered.map((r) => r.toLowerCase())), [registered]);
  const keyword = query.trim().toLowerCase();
  const filtered = (repos ?? []).filter((r) => r.fullName.toLowerCase().includes(keyword));
  const manual = REPO_FULL_NAME.test(query.trim()) && !filtered.some((r) => r.fullName.toLowerCase() === keyword)
    ? query.trim()
    : null;

  const register = async (fullName: string) => {
    setBusy(fullName);
    setError(null);
    const res = await createProject(fullName);
    setBusy(null);
    if (res.ok) {
      onCreated(res.data);
      return;
    }
    setError(
      res.status === 409 ? t("duplicate")
        : res.status === 404 ? t("notFound")
        : res.status === 400 ? res.error || t("failed")
        : t("failed"),
    );
  };

  return (
    <Modal title={t("title")} onClose={onClose}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchPlaceholder")}
        className="input mb-3"
      />
      <p className="mb-3 text-xs text-gray-500">{t("manualHint")}</p>

      {error && <p role="alert" className="mb-3 text-sm text-red-500">{error}</p>}

      <ul className="max-h-80 space-y-1 overflow-y-auto">
        {manual && (
          <li>
            <RepoRow label={t("manualAdd", { repo: manual })} disabled={taken.has(manual.toLowerCase())}
              busy={busy === manual} onClick={() => register(manual)} />
          </li>
        )}
        {repos === null && !loadError && [0, 1, 2].map((i) => (
          <li key={i}><Skeleton className="h-9 w-full rounded-lg" /></li>
        ))}
        {loadError && <li className="py-4 text-center text-sm text-gray-500">{t("loadFailed")}</li>}
        {repos !== null && filtered.length === 0 && !manual && (
          <li className="py-4 text-center text-sm text-gray-500">{t("empty")}</li>
        )}
        {filtered.map((r) => {
          const done = taken.has(r.fullName.toLowerCase());
          return (
            <li key={r.fullName}>
              <RepoRow label={r.fullName} note={done ? t("registered") : undefined} disabled={done || busy !== null}
                busy={busy === r.fullName} onClick={() => register(r.fullName)} />
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

function RepoRow({ label, note, disabled, busy, onClick }: {
  label: string;
  note?: string;
  disabled: boolean;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
      <span className="min-w-0 truncate">{label}</span>
      {busy ? <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
        : note && <span className="shrink-0 text-xs text-gray-400">{note}</span>}
    </button>
  );
}
