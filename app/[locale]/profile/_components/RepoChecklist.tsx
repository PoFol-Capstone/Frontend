"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, ChevronDown, Copy, ExternalLink } from "lucide-react";
import { setCheckIgnored } from "@/lib/githubAnalysis";
import { checkTotals } from "@/lib/coachContent";
import type { AnalyzedRepo, CheckCode, GitHubAnalysis, RepoCheck } from "@/types/githubAnalysis";

type Props = {
  analysis: GitHubAnalysis;
  onChange: (next: GitHubAnalysis) => void;
};

const README_TEMPLATE = `# 프로젝트 이름

한 줄 소개

## 주요 기능
-

## 기술 스택
-

## 실행 방법
\`\`\`bash

\`\`\`

## 배포 링크
-

## 팀원 · 역할
-
`;

const COMMIT_CONVENTION = `feat: 로그인 API 추가
fix: 토큰 만료 시 재발급 오류 수정
refactor: 게시글 서비스 분리
docs: 실행 방법 README에 추가
test: 회원가입 검증 테스트 추가`;

/** 주 언어별 테스트 시작 가이드 링크 */
const TEST_GUIDES: Record<string, string> = {
  Java: "https://docs.spring.io/spring-boot/reference/testing/index.html",
  Kotlin: "https://docs.spring.io/spring-boot/reference/testing/index.html",
  TypeScript: "https://vitest.dev/guide/",
  JavaScript: "https://vitest.dev/guide/",
  Python: "https://docs.pytest.org/en/stable/getting-started.html",
  Dart: "https://docs.flutter.dev/testing/overview",
  Go: "https://go.dev/doc/tutorial/add-a-test",
};

/** 3.2 레포 점검 체크리스트 — 점수 대신 해결하면 사라지는 할 일 목록 */
export default function RepoChecklist({ analysis, onChange }: Props) {
  const t = useTranslations("profile.github.checklist");
  const [openRepo, setOpenRepo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totals = checkTotals(analysis.repos);
  const reposWithChecks = analysis.repos.filter((r) => r.checks.length > 0);
  const allClear = totals.size === 0 && analysis.accountChecks.every((c) => c.ignored);

  const toggleIgnore = async (repo: string | null, check: RepoCheck) => {
    const ignored = !check.ignored;
    const apply = (value: boolean) => (c: RepoCheck) => (c.code === check.code ? { ...c, ignored: value } : c);
    const update = (value: boolean): GitHubAnalysis =>
      repo === null
        ? { ...analysis, accountChecks: analysis.accountChecks.map(apply(value)) }
        : {
            ...analysis,
            repos: analysis.repos.map((r) => (r.fullName === repo ? { ...r, checks: r.checks.map(apply(value)) } : r)),
          };

    setError(null);
    onChange(update(ignored));
    const res = await setCheckIgnored(repo, check.code, ignored);
    if (!res.ok) {
      onChange(update(!ignored));
      setError(res.error);
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">{t("heading")}</h2>
        <p className="mt-1 text-sm text-gray-500">{t("desc")}</p>
      </div>

      {allClear && (
        <p className="flex items-center gap-2 rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700">
          <CheckCircle2 size={18} /> {t("allClear")}
        </p>
      )}

      {totals.size > 0 && (
        <ul className="flex flex-wrap gap-2">
          {[...totals.entries()].map(([code, count]) => (
            <li key={code} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              {t("chip", { label: t(`codes.${code}.label`), count })}
            </li>
          ))}
        </ul>
      )}

      {analysis.accountChecks.length > 0 && (
        <ul className="space-y-2">
          {analysis.accountChecks.map((check) => (
            <CheckRow key={check.code} check={check} onToggleIgnore={() => toggleIgnore(null, check)} />
          ))}
        </ul>
      )}

      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}

      <ul className="divide-y divide-gray-200 rounded-2xl border border-gray-200">
        {reposWithChecks.map((repo) => {
          const open = openRepo === repo.fullName;
          const remaining = repo.checks.filter((c) => !c.ignored).length;
          return (
            <li key={repo.fullName}>
              <button
                type="button"
                onClick={() => setOpenRepo(open ? null : repo.fullName)}
                aria-expanded={open}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="font-medium">
                  {repo.name}
                  {repo.partial && <span className="ml-2 text-xs text-gray-400">{t("partial")}</span>}
                </span>
                <span className="flex items-center gap-2 text-sm text-gray-500">
                  {remaining > 0 ? t("remaining", { count: remaining }) : t("done")}
                  <ChevronDown size={16} className={`transition ${open ? "rotate-180" : ""}`} />
                </span>
              </button>
              {open && (
                <ul className="space-y-2 px-5 pb-5">
                  {repo.checks.map((check) => (
                    <CheckRow key={check.code} check={check} repo={repo}
                      onToggleIgnore={() => toggleIgnore(repo.fullName, check)} />
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function CheckRow({ check, repo, onToggleIgnore }: { check: RepoCheck; repo?: AnalyzedRepo; onToggleIgnore: () => void }) {
  const t = useTranslations("profile.github.checklist");
  return (
    <li className={`rounded-xl border p-4 ${check.ignored ? "border-gray-100 bg-gray-50 text-gray-400" : "border-gray-200"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className={`text-sm font-semibold ${check.ignored ? "line-through" : ""}`}>{t(`codes.${check.code}.label`)}</p>
          <p className="mt-0.5 text-sm text-gray-500">{t(`codes.${check.code}.guide`)}</p>
        </div>
        <button type="button" onClick={onToggleIgnore} className="shrink-0 text-xs font-medium text-gray-500 hover:text-black">
          {check.ignored ? t("unignore") : t("ignore")}
        </button>
      </div>
      {!check.ignored && <CheckAction code={check.code} repo={repo} />}
    </li>
  );
}

function CheckAction({ code, repo }: { code: CheckCode; repo?: AnalyzedRepo }) {
  const t = useTranslations("profile.github.checklist");
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드 권한이 없으면 조용히 무시 (사용자가 직접 선택해 복사할 수 있다)
    }
  };
  const linkClass = "mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-black";
  const repoUrl = repo ? `https://github.com/${repo.fullName}` : null;

  switch (code) {
    case "NO_README":
      return (
        <button type="button" onClick={() => copy(README_TEMPLATE)} className={linkClass}>
          <Copy size={14} /> {copied ? t("copied") : t("copyReadmeTemplate")}
        </button>
      );
    case "NO_DESCRIPTION":
    case "NO_HOMEPAGE":
      return repoUrl ? (
        <a href={repoUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
          <ExternalLink size={14} /> {t("openRepoAbout")}
        </a>
      ) : null;
    case "NO_TESTS": {
      const guide = (repo?.language && TEST_GUIDES[repo.language]) || null;
      return guide ? (
        <a href={guide} target="_blank" rel="noopener noreferrer" className={linkClass}>
          <ExternalLink size={14} /> {t("testGuide", { language: repo!.language! })}
        </a>
      ) : null;
    }
    case "TOO_FEW_COMMITS":
      return repoUrl ? (
        <a href={`${repoUrl}/settings`} target="_blank" rel="noopener noreferrer" className={linkClass}>
          <ExternalLink size={14} /> {t("openSettings")}
        </a>
      ) : null;
    case "WEAK_COMMIT_MESSAGES":
      return (
        <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">{COMMIT_CONVENTION}</pre>
      );
    case "NO_PROFILE_README":
      return <p className="mt-3 text-xs text-gray-500">{t("profileReadmeAction")}</p>;
    default:
      return null;
  }
}
