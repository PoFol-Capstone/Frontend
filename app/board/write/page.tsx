"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { mockProjectData } from "./_data/mockData";

const uploadIconLabel: Record<string, string> = {
  erd: "ERD",
  figma: "UI",
  class: "CLS",
  extra: "+",
};

type Repo = { name: string; fullName: string };

export default function Page() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [isLoadingRepos, setIsLoadingRepos] = useState(true);
  const [loadingStep, setLoadingStep] = useState<
    "idle" | "repo" | "ai" | "thumbnail"
  >("idle");
  const [loadError, setLoadError] = useState("");
  const [useAiSummary, setUseAiSummary] = useState(false);

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [mainFeatures, setMainFeatures] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [deployUrl, setDeployUrl] = useState("");
  const [readmeText, setReadmeText] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isThumbnailLoading, setIsThumbnailLoading] = useState(false);
  const [teamRecruitEnabled, setTeamRecruitEnabled] = useState(
    mockProjectData.teamRecruitment.enabled,
  );
  const [recruitDescription, setRecruitDescription] = useState(
    mockProjectData.teamRecruitment.description,
  );
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    mockProjectData.teamRecruitment.selectedRoles,
  );
  const [kakaoLink, setKakaoLink] = useState(
    mockProjectData.teamRecruitment.kakaoLink,
  );

  useEffect(() => {
    fetch("/api/github/repos")
      .then((r) => r.json())
      .then((data: Repo[]) => {
        setRepos(data);
        if (data.length > 0) setSelectedRepo(data[0].fullName);
      })
      .catch(() => setLoadError("레포지토리 목록을 불러오지 못했습니다."))
      .finally(() => setIsLoadingRepos(false));
  }, []);

  const handleLoadInfo = async () => {
    if (!selectedRepo) return;
    setLoadingStep("repo");
    setLoadError("");
    try {
      const res = await fetch(`/api/github/repo-info?repo=${selectedRepo}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const name = data.projectName ?? "";
      const stack = data.techStack ?? [];
      setProjectName(name);
      setProjectDescription(data.projectDescription ?? "");
      setMainFeatures(data.mainFeatures ?? "");
      setTechStack(stack);
      setDeployUrl(data.deployUrl ?? "");
      setReadmeText(data.readmeText ?? "");
      setThumbnailUrl("");

      if (useAiSummary) {
        setLoadingStep("ai");
        const aiRes = await fetch("/api/ai/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectName: name,
            readmeText: data.readmeText ?? "",
            techStack: stack,
          }),
        });
        if (!aiRes.ok) throw new Error("ai");
        const aiData = await aiRes.json();
        setProjectDescription(aiData.projectDescription ?? "");
        setMainFeatures(aiData.mainFeatures ?? "");

        setLoadingStep("thumbnail");
        const params = new URLSearchParams({
          title: name,
          stack: stack.join(","),
        });
        setIsThumbnailLoading(true);
        setThumbnailUrl(`/api/og?${params.toString()}`);
      }
    } catch (e) {
      if (e instanceof Error && e.message === "ai") {
        setLoadError("AI 요약에 실패했습니다.");
      } else {
        setLoadError("프로젝트 정보를 불러오지 못했습니다.");
      }
    } finally {
      setLoadingStep("idle");
    }
  };

  const handleSummarize = async () => {
    if (!projectName) return;
    setIsSummarizing(true);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName, readmeText, techStack }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProjectDescription(data.projectDescription ?? "");
      setMainFeatures(data.mainFeatures ?? "");
    } catch {
      setLoadError("AI 요약에 실패했습니다.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGenerateThumbnail = () => {
    if (!projectName) return;
    const params = new URLSearchParams({
      title: projectName,
      stack: techStack.join(","),
    });
    setIsThumbnailLoading(true);
    setThumbnailUrl(`/api/og?${params.toString()}`);
  };

  const removeTag = (tag: string) => {
    setTechStack(techStack.filter((t) => t !== tag));
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <h1 className="text-2xl font-bold">프로젝트 등록</h1>

      {/* GitHub 불러오기 */}
      <section className="border border-gray-200 rounded-2xl p-6 space-y-4 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">
            G
          </div>
          <h2 className="text-base font-semibold">GitHub 불러오기</h2>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            Repository 선택
          </label>
          <div className="relative">
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              disabled={isLoadingRepos}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 appearance-none bg-white pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:text-gray-400"
            >
              {isLoadingRepos ? (
                <option>불러오는 중...</option>
              ) : (
                repos.map((repo) => (
                  <option key={repo.fullName} value={repo.fullName}>
                    {repo.name}
                  </option>
                ))
              )}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
              ▾
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={useAiSummary}
            onChange={(e) => setUseAiSummary(e.target.checked)}
            className="w-4 h-4 rounded accent-black cursor-pointer"
          />
          <span className="text-sm font-medium text-gray-700">AI 요약 사용</span>
          <span className="text-xs text-gray-400">
            — 불러오기와 함께 AI 요약 및 썸네일을 자동 생성합니다
          </span>
        </label>

        <button
          onClick={handleLoadInfo}
          disabled={loadingStep !== "idle" || isLoadingRepos || !selectedRepo}
          className="w-full bg-black text-white py-3 rounded-xl font-medium text-sm hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingStep === "repo"
            ? "레포지토리 정보 불러오는 중..."
            : loadingStep === "ai"
              ? "AI 요약 중..."
              : loadingStep === "thumbnail"
                ? "썸네일 생성 중..."
                : "프로젝트 정보 불러오기"}
        </button>

        {loadError && (
          <p className="text-sm text-red-500">{loadError}</p>
        )}

        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" />
            <span className="text-xs text-gray-500">
              GitHub 계정이 연결되어 있습니다.
            </span>
          </div>
          <p className="text-xs text-gray-400 pl-5">
            연결된 GitHub 계정의 레포지토리 정보를 자동으로 불러옵니다.
          </p>
        </div>
      </section>

      {/* AI 분석 결과 */}
      <section className="border border-gray-200 rounded-2xl p-6 space-y-5 bg-white">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">AI 분석 결과</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-orange-100 text-orange-500 px-2.5 py-1 rounded-full font-medium">
                수정 가능
              </span>
              <button
                onClick={handleSummarize}
                disabled={isSummarizing || !projectName}
                className="text-xs bg-black text-white px-2.5 py-1 rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSummarizing ? "요약 중..." : "AI 요약"}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            GitHub 레포지토리와 README를 기반으로 자동 생성된 정보입니다. 수정할
            수 있어요.
          </p>
        </div>

        {/* 프로젝트 이름 */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">프로젝트 이름</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>

        {/* 프로젝트 설명 */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">프로젝트 설명</label>
          <textarea
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>

        {/* 주요 기능 */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">주요 기능</label>
          <textarea
            value={mainFeatures}
            onChange={(e) => setMainFeatures(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>

        {/* 배포 링크 */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">배포된 사이트</label>
          <input
            type="url"
            value={deployUrl}
            onChange={(e) => setDeployUrl(e.target.value)}
            placeholder="https://..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>

        {/* 기술 스택 */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">기술 스택</label>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
              >
                {tech}
                <button
                  onClick={() => removeTag(tech)}
                  className="text-gray-400 hover:text-gray-600 text-base leading-none ml-0.5"
                  aria-label={`${tech} 제거`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 추천 썸네일 */}
        <div className="space-y-3">
          <label className="text-sm font-medium">추천 썸네일</label>
          <div className="relative rounded-xl h-44 overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200">
            {/* 스켈레톤 — 로딩 중일 때만 표시 */}
            {isThumbnailLoading && (
              <div className="absolute inset-0 z-10 flex flex-col gap-3 items-start justify-end p-6 animate-pulse">
                <div className="h-3 w-20 rounded-full bg-gray-300" />
                <div className="h-8 w-2/3 rounded-lg bg-gray-300" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 rounded-md bg-gray-300" />
                  <div className="h-6 w-16 rounded-md bg-gray-300" />
                  <div className="h-6 w-16 rounded-md bg-gray-300" />
                </div>
              </div>
            )}

            {/* 빈 상태 */}
            {!thumbnailUrl && !isThumbnailLoading && (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                <div className="w-10 h-10 rounded-xl border-2 border-gray-200 bg-white" />
                <span className="text-sm">썸네일을 생성해주세요</span>
              </div>
            )}

            {/* 실제 이미지 — 로드 완료 전까지 숨김 */}
            {thumbnailUrl && (
              <Image
                key={thumbnailUrl}
                src={thumbnailUrl}
                alt="썸네일 미리보기"
                fill
                unoptimized
                sizes="(max-width: 672px) 100vw, 672px"
                className={`object-cover transition-opacity duration-300 ${isThumbnailLoading ? "opacity-0" : "opacity-100"}`}
                onLoad={() => setIsThumbnailLoading(false)}
                onError={() => {
                  setIsThumbnailLoading(false);
                  setThumbnailUrl("");
                }}
              />
            )}
          </div>
          <div className="flex justify-center">
            <button
              onClick={handleGenerateThumbnail}
              disabled={!projectName || isThumbnailLoading}
              className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isThumbnailLoading ? "생성 중..." : thumbnailUrl ? "썸네일 재생성" : "썸네일 생성"}
            </button>
          </div>
        </div>
      </section>

      {/* 추가 자료 업로드 */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">추가 자료 업로드</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            구조 설계 및 산출물은 직접 업로드해주세요.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {mockProjectData.uploadSections.map((section) => (
            <button
              key={section.id}
              className="border border-gray-200 rounded-2xl p-5 flex flex-col items-center gap-2 text-center bg-white hover:border-gray-300 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xs font-bold text-gray-400">
                {uploadIconLabel[section.iconType]}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {section.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {section.subtitle}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                ↑ 클릭하여 업로드
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 팀원 모집 */}
      <section className="border border-gray-200 rounded-2xl p-6 space-y-4 bg-white">
        <div>
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="teamRecruit"
              checked={teamRecruitEnabled}
              onChange={(e) => setTeamRecruitEnabled(e.target.checked)}
              className="w-5 h-5 rounded accent-black cursor-pointer"
            />
            <label
              htmlFor="teamRecruit"
              className="text-base font-semibold cursor-pointer"
            >
              팀원 모집
            </label>
          </div>
          <p className="text-sm text-gray-500 mt-1.5 pl-7">
            팀원 모집 기능을 설정하고 지원을 받아보세요.
          </p>
        </div>

        <div className="space-y-4">
          {/* 프로젝트 설명 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">프로젝트 설명</label>
            <textarea
              value={recruitDescription}
              onChange={(e) => setRecruitDescription(e.target.value)}
              placeholder="프로젝트에 대해 설명해주세요"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          {/* 모집 역할 선택 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">모집 역할 선택</label>
            <div className="flex gap-2">
              {mockProjectData.teamRecruitment.roles.map((role) => (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    selectedRoles.includes(role)
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* 오픈채팅방 링크 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">오픈채팅방 링크</label>
            <input
              type="text"
              value={kakaoLink}
              onChange={(e) => setKakaoLink(e.target.value)}
              placeholder="https://open.kakao.com/..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>
        </div>
      </section>

      {/* 게시글 등록 버튼 */}
      <button className="w-full bg-black text-white py-4 rounded-xl font-semibold text-base hover:bg-gray-900 transition-colors">
        게시글 등록
      </button>
    </div>
  );
}
