"use client";
import type { Repo } from "../_hooks/useGithubRepos";
import { useTranslations } from "next-intl";
import Field from "@/components/ui/Field";

type Props = {
  repos: Repo[];
  selectedRepo: string;
  isLoadingRepos: boolean;
  isGithubConnected: boolean;
  isCheckingGithub: boolean;
  isLoadingRepoData: boolean;
  isAIWriting: boolean;
  aiError: string;
  isConnecting: boolean;
  connectError: string;
  onRepoChange: (repo: string) => void;
  onAILoad: () => void;
  onGithubConnect: () => void;
};

export default function GithubSection({
  repos,
  selectedRepo,
  isLoadingRepos,
  isGithubConnected,
  isCheckingGithub,
  isLoadingRepoData,
  isAIWriting,
  aiError,
  isConnecting,
  connectError,
  onRepoChange,
  onAILoad,
  onGithubConnect,
}: Props) {
  const t = useTranslations("board.write.github");

  return (
    <section className="card relative">
      <div className={!isGithubConnected ? "pointer-events-none opacity-35" : ""}>
        <h2 className="text-lg font-bold tracking-tight text-gray-900">{t("title")}</h2>

        <Field label={t("selectRepo")} className="mt-6">
          <select
            value={selectedRepo}
            onChange={(e) => onRepoChange(e.target.value)}
            disabled={isLoadingRepos}
            className="input"
          >
            {isLoadingRepos ? (
              <option>{t("loading")}</option>
            ) : (
              <>
                <option value="">{t("selectRepoPlaceholder")}</option>
                {Array.isArray(repos) && repos.length > 0 ? (
                  repos.map((repo) => (
                    <option key={repo.fullName} value={repo.fullName}>
                      {repo.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>{t("noRepos")}</option>
                )}
              </>
            )}
          </select>
        </Field>

        {selectedRepo && (
          <div className="mt-6">
            <span className="mb-2 block text-sm font-semibold text-gray-900">{t("githubLink")}</span>
            <div className="input flex items-center bg-gray-50 text-gray-500 select-all">
              https://github.com/{selectedRepo}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onAILoad}
          disabled={isLoadingRepoData || isAIWriting}
          className="btn btn-primary mt-6 w-full"
        >
          {isAIWriting ? t("aiWriting") : isLoadingRepoData ? t("loading") : t("aiWrite")}
        </button>

        {aiError && <p className="mt-2 text-xs text-red-500">{aiError}</p>}

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-400">{t("connectedHint")}</p>
          <button
            type="button"
            onClick={onGithubConnect}
            disabled={isConnecting}
            className="text-xs text-gray-400 underline hover:text-gray-600 disabled:opacity-50"
          >
            {isConnecting ? t("connecting") : t("reconnect")}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {t("autoImportHint")}
        </p>
      </div>

      {isCheckingGithub && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-sm">
          <div className="text-sm text-gray-400">{t("checkingConnection")}</div>
        </div>
      )}

      {!isCheckingGithub && !isGithubConnected && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-72 rounded-2xl bg-white p-5 shadow-lg">
            <h3 className="text-lg font-bold">{t("connectPromptTitle")}</h3>
            <p className="mt-3 text-sm leading-5 text-gray-500">
              {t("connectPromptDesc")}
            </p>
            {connectError && (
              <p className="mt-2 text-xs text-red-500">{connectError}</p>
            )}
            <button
              type="button"
              onClick={onGithubConnect}
              disabled={isConnecting}
              className="btn btn-secondary btn-sm mt-4"
            >
              {isConnecting ? t("connecting") : t("connectAccount")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
