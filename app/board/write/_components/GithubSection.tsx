"use client";
import type { Repo } from "../_hooks/useGithubRepos";

type Props = {
  repos: Repo[];
  selectedRepo: string;
  isLoadingRepos: boolean;
  isGithubConnected: boolean;
  isCheckingGithub: boolean;
  isLoadingRepoData: boolean;
  isAIWriting: boolean;
  aiError: string;
  onRepoChange: (repo: string) => void;
  onLoadInfo: () => void;
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
  onRepoChange,
  onLoadInfo,
  onAILoad,
  onGithubConnect,
}: Props) {
  return (
    <section className="relative mb-5 rounded-2xl border border-gray-300 p-4">
      <div className={!isGithubConnected ? "pointer-events-none opacity-35" : ""}>
        <h2 className="text-xl font-bold">GitHub 불러오기</h2>

        <label className="mt-3 block">
          <span className="mb-1 block text-sm font-semibold">Repository 선택</span>
          <select
            value={selectedRepo}
            onChange={(e) => onRepoChange(e.target.value)}
            disabled={isLoadingRepos}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none"
          >
            {isLoadingRepos ? (
              <option>불러오는 중...</option>
            ) : (
              <>
                <option value="">레포지토리를 선택하세요</option>
                {Array.isArray(repos) && repos.length > 0 ? (
                  repos.map((repo) => (
                    <option key={repo.fullName} value={repo.fullName}>
                      {repo.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>레포지토리 없음</option>
                )}
              </>
            )}
          </select>
        </label>

        {selectedRepo && (
          <div className="mt-3">
            <span className="mb-1 block text-sm font-semibold">GitHub 링크</span>
            <div className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 select-all">
              https://github.com/{selectedRepo}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onLoadInfo}
          disabled={isLoadingRepoData || isAIWriting}
          className="mt-3 w-full rounded-xl bg-black py-3 text-sm font-semibold text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingRepoData && !isAIWriting ? "불러오는 중..." : "프로젝트 정보 불러오기"}
        </button>

        <button
          type="button"
          onClick={onAILoad}
          disabled={isLoadingRepoData || isAIWriting}
          className="mt-2 w-full rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAIWriting ? "AI 작성 중..." : isLoadingRepoData ? "불러오는 중..." : "AI로 작성하기"}
        </button>

        {aiError && <p className="mt-2 text-xs text-red-500">{aiError}</p>}

        <p className="mt-3 text-xs text-gray-400">GitHub 계정이 연결되어 있습니다.</p>
        <p className="mt-1 text-xs text-gray-400">
          연결된 GitHub 계정의 레포지토리 정보를 자동으로 불러옵니다.
        </p>
      </div>

      {isCheckingGithub && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-sm">
          <div className="text-sm text-gray-400">GitHub 연결 확인 중...</div>
        </div>
      )}

      {!isCheckingGithub && !isGithubConnected && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-75 rounded-2xl bg-white p-5 shadow-lg">
            <h3 className="text-lg font-bold">GitHub 계정을 연결해주세요</h3>
            <p className="mt-3 text-sm leading-5 text-gray-500">
              레포지토리를 불러와 프로젝트 정보를 자동으로 채울 수 있습니다.
            </p>
            <button
              type="button"
              onClick={onGithubConnect}
              className="mt-4 rounded-full border border-gray-300 px-4 py-2 text-sm text-blue-600 hover:bg-gray-50"
            >
              GitHub 계정 연결하기
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
