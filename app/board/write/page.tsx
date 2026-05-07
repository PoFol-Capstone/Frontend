"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPost } from "@/lib/post";
import { LinkType, PostType } from "@/types/post";
import type { PostLink } from "@/types/post";
import type { Skill } from "@/types/skill";
import SkillPicker from "./_components/SkillPicker";

type Repo = { name: string; fullName: string };
type UploadSectionId = "erd" | "figma" | "class" | "extra";

const UPLOAD_SECTIONS: {
  id: UploadSectionId;
  title: string;
  subtitle: string;
  label: string;
  linkType: LinkType;
}[] = [
  { id: "erd", title: "ERD 업로드", subtitle: "데이터베이스 설계 다이어그램", label: "ERD", linkType: LinkType.ERD },
  { id: "figma", title: "피그마 구조도", subtitle: "UI/UX 디자인 파일", label: "UI", linkType: LinkType.FIGMA },
  { id: "class", title: "클래스 다이어그램", subtitle: "시스템 구조 설계 문서", label: "CLS", linkType: LinkType.CLASS },
  { id: "extra", title: "추가 자료", subtitle: "UML, 플로우차트 등", label: "+", linkType: LinkType.EXTRA },
];

const RECRUIT_ROLES = ["Frontend", "Backend", "Designer"];

export default function Page() {
  const router = useRouter();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const [isCheckingGithub, setIsCheckingGithub] = useState(true);
  const hasGithubError = useRef(false);

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [mainFeatures, setMainFeatures] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [deployUrl, setDeployUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isThumbnailLoading, setIsThumbnailLoading] = useState(false);
  const [isLoadingRepoData, setIsLoadingRepoData] = useState(false);
  const [isAIWriting, setIsAIWriting] = useState(false);

  // 태그
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // 추가 자료 링크
  const [uploadLinks, setUploadLinks] = useState<Record<UploadSectionId, string>>({
    erd: "",
    figma: "",
    class: "",
    extra: "",
  });
  const [activeUpload, setActiveUpload] = useState<UploadSectionId | null>(null);
  const [tempLink, setTempLink] = useState("");

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const featuresRef = useRef<HTMLTextAreaElement>(null);
  const recruitRef = useRef<HTMLTextAreaElement>(null);

  const [teamRecruitEnabled, setTeamRecruitEnabled] = useState(false);
  const [recruitDescription, setRecruitDescription] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiError, setAiError] = useState("");

  const resizeTextarea = (ref: React.RefObject<HTMLTextAreaElement | null>) => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  useEffect(() => { resizeTextarea(descriptionRef); }, [projectDescription]);
  useEffect(() => { resizeTextarea(featuresRef); }, [mainFeatures]);
  useEffect(() => { resizeTextarea(recruitRef); }, [recruitDescription]);

  // OAuth 콜백 복귀 감지 + GitHub 연결 여부 확인
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = new URL(window.location.href);

    if (params.get("github_error") === "true") {
      hasGithubError.current = true;
      url.searchParams.delete("github_error");
      window.history.replaceState({}, "", url.toString());
    }

    if (params.get("github_connected") === "true") {
      url.searchParams.delete("github_connected");
      window.history.replaceState({}, "", url.toString());
      setIsGithubConnected(true);
      setIsCheckingGithub(false);
      return;
    }

    fetch("/api/user/me/github-status")
      .then((r) => r.json())
      .then(async (data) => {
        const connected = data.connected ?? false;
        setIsGithubConnected(connected);
        if (!connected && !hasGithubError.current) {
          try {
            const res = await fetch("/api/auth/github/connect");
            const connectData = await res.json();
            if (res.ok && connectData.redirectUrl) {
              window.location.href = connectData.redirectUrl;
            }
          } catch { /* ignore */ }
        }
      })
      .catch(() => {})
      .finally(() => setIsCheckingGithub(false));
  }, []);

  // GitHub 연결 후 레포지토리 목록 불러오기
  useEffect(() => {
    if (!isGithubConnected) return;

    setIsLoadingRepos(true);
    fetch("/api/github/repos")
      .then((r) => r.json())
      .then((data: Repo[]) => {
        if (Array.isArray(data)) setRepos(data);
      })
      .catch(() => {})
      .finally(() => setIsLoadingRepos(false));
  }, [isGithubConnected]);

  const handleGithubConnect = async () => {
    try {
      const res = await fetch("/api/auth/github/connect");
      const data = await res.json();
      if (!res.ok) return;
      if (data.redirectUrl) window.location.href = data.redirectUrl;
    } catch { /* ignore */ }
  };

  const handleLoadInfo = async (forceAI = false, repoOverride?: string) => {
    const repo = repoOverride ?? selectedRepo;
    if (!repo) return;
    setAiError("");
    setIsLoadingRepoData(true);
    try {
      const res = await fetch(`/api/github/repo-info?repo=${repo}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const name = data.projectName ?? "";
      const stack = data.techStack ?? [];
      setProjectName(name);
      if (!forceAI) {
        setProjectDescription(data.projectDescription ?? "");
        setMainFeatures(data.mainFeatures ?? "");
      }
      setTechStack(stack);
      setDeployUrl(data.deployUrl ?? "");
      setThumbnailUrl("");

      const mappedSkills = (
        await Promise.all(
          (stack as string[]).map(async (techName) => {
            try {
              const r = await fetch(`/api/skills?q=${encodeURIComponent(techName)}`);
              const results: Skill[] = await r.json();
              return results.find((s) => s.name.toLowerCase() === techName.toLowerCase()) ?? null;
            } catch { return null; }
          }),
        )
      ).filter((s): s is Skill => s !== null);
      setSelectedSkills(mappedSkills);
      setIsLoadingRepoData(false);

      if (forceAI) {
        setIsAIWriting(true);
        const aiRes = await fetch("/api/ai/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectName: name,
            readmeText: data.readmeText ?? "",
            techStack: stack,
          }),
        });
        const aiData = await aiRes.json();
        if (!aiRes.ok) throw new Error(aiData.error ?? "AI 요약에 실패했습니다.");
        setProjectDescription(aiData.projectDescription ?? "");
        setMainFeatures(aiData.mainFeatures ?? "");
        setIsAIWriting(false);

        setIsThumbnailLoading(true);
        const thumbRes = await fetch("/api/ai/thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectName: name,
            techStack: stack,
            projectDescription: aiData.projectDescription ?? "",
            mainFeatures: aiData.mainFeatures ?? "",
          }),
        });
        const thumbData = await thumbRes.json();
        if (!thumbRes.ok) throw new Error(thumbData.error ?? "썸네일 생성에 실패했습니다.");
        setThumbnailUrl(thumbData.url ?? "");
        setIsThumbnailLoading(false);
      }
    } catch (err) {
      setIsLoadingRepoData(false);
      setIsAIWriting(false);
      setIsThumbnailLoading(false);
      if (err instanceof Error) setAiError(err.message);
    }
  };

  const handleGenerateThumbnail = async () => {
    if (!projectName) return;
    setIsThumbnailLoading(true);
    setThumbnailUrl("");
    try {
      const res = await fetch("/api/ai/thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName, techStack, projectDescription, mainFeatures }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setThumbnailUrl(data.url ?? "");
    } catch { /* ignore */ }
    finally { setIsThumbnailLoading(false); }
  };

  const handleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsThumbnailLoading(true);
    setThumbnailUrl("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload/thumbnail", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setThumbnailUrl(data.url ?? "");
    } catch { /* ignore */ }
    finally {
      setIsThumbnailLoading(false);
      e.target.value = "";
    }
  };

  // 태그 입력 핸들러
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().replace(/,$/, "");
      if (tag && !tags.includes(tag)) setTags((prev) => [...prev, tag]);
      setTagInput("");
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  // 업로드 링크 모달 핸들러
  const openUploadModal = (id: UploadSectionId) => {
    setTempLink(uploadLinks[id]);
    setActiveUpload(id);
  };

  const handleSaveLink = () => {
    if (!activeUpload) return;
    setUploadLinks((prev) => ({ ...prev, [activeUpload]: tempLink.trim() }));
    setActiveUpload(null);
  };

  const handleSubmit = async () => {
    if (!projectName) return;
    setIsSubmitting(true);
    try {
      const content = [
        projectDescription,
        mainFeatures ? `## 주요 기능\n${mainFeatures}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      const links: PostLink[] = [
        ...(selectedRepo
          ? [{ type: LinkType.GITHUB, url: `https://github.com/${selectedRepo}` }]
          : []),
        ...(deployUrl ? [{ type: LinkType.DEPLOY, url: deployUrl }] : []),
        ...(uploadLinks.figma ? [{ type: LinkType.FIGMA, url: uploadLinks.figma }] : []),
        ...(uploadLinks.erd ? [{ type: LinkType.ERD, url: uploadLinks.erd }] : []),
        ...(uploadLinks.class ? [{ type: LinkType.CLASS, url: uploadLinks.class }] : []),
        ...(uploadLinks.extra ? [{ type: LinkType.EXTRA, url: uploadLinks.extra }] : []),
      ];

      const post = await createPost({
        title: projectName,
        content,
        thumbnailUrl,
        type: teamRecruitEnabled ? PostType.RECRUIT : PostType.DISPLAY,
        links,
        recruitNote: recruitDescription,
        recruitPositions: selectedRoles.map((role) => ({
          positionType: role.toUpperCase(),
          maxCount: 1,
        })),
        isPublished: true,
        skillIds: selectedSkills.map((s) => s.id),
        tagNames: tags,
      });
      router.push(`/board/${post.uuid}`);
    } catch { /* ignore */ }
    finally { setIsSubmitting(false); }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const activeSection = UPLOAD_SECTIONS.find((s) => s.id === activeUpload);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <h1 className="text-2xl font-bold">프로젝트 등록</h1>

      {/* GitHub 불러오기 */}
      <section className="relative mb-5 rounded-2xl border border-gray-300 p-4">
        <div className={!isGithubConnected ? "pointer-events-none opacity-35" : ""}>
          <h2 className="text-xl font-bold">GitHub 불러오기</h2>

          <label className="mt-3 block">
            <span className="mb-1 block text-sm font-semibold">Repository 선택</span>
            <select
              value={selectedRepo}
              onChange={(e) => {
                setSelectedRepo(e.target.value);
                if (e.target.value) handleLoadInfo(false, e.target.value);
              }}
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

          <button
            type="button"
            onClick={() => handleLoadInfo()}
            disabled={isLoadingRepoData || isAIWriting}
            className="mt-3 w-full rounded-xl bg-black py-3 text-sm font-semibold text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingRepoData && !isAIWriting ? "불러오는 중..." : "프로젝트 정보 불러오기"}
          </button>

          <button
            type="button"
            onClick={() => handleLoadInfo(true)}
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
                onClick={handleGithubConnect}
                className="mt-4 rounded-full border border-gray-300 px-4 py-2 text-sm text-blue-600 hover:bg-gray-50"
              >
                GitHub 계정 연결하기
              </button>
            </div>
          </div>
        )}
      </section>

      {/* AI 분석 결과 */}
      {isGithubConnected && selectedRepo && (
        <section className="relative border border-gray-200 rounded-2xl p-6 space-y-5 bg-white">
          <span className="absolute right-4 top-4 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
            수정 가능
          </span>

          <div className="space-y-1">
            <h2 className="text-base font-semibold">AI 분석 결과</h2>
            <p className="text-xs text-gray-400">
              GitHub 레포지토리와 README를 기반으로 자동 생성된 정보입니다. 수정할 수 있어요.
            </p>
          </div>

          {/* 프로젝트 이름 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">프로젝트 이름</label>
            {isLoadingRepoData ? (
              <div className="animate-pulse h-10 w-full rounded-lg bg-gray-200" />
            ) : (
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            )}
          </div>

          {/* 프로젝트 설명 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">프로젝트 설명</label>
            {isLoadingRepoData || isAIWriting ? (
              <div className="animate-pulse space-y-2 rounded-lg border border-gray-200 px-3 py-3">
                <div className="h-3.5 w-full rounded bg-gray-200" />
                <div className="h-3.5 w-5/6 rounded bg-gray-200" />
                <div className="h-3.5 w-4/5 rounded bg-gray-200" />
              </div>
            ) : (
              <textarea
                ref={descriptionRef}
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={1}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            )}
          </div>

          {/* 주요 기능 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">주요 기능</label>
            {isLoadingRepoData || isAIWriting ? (
              <div className="animate-pulse space-y-2 rounded-lg border border-gray-200 px-3 py-3">
                <div className="h-3.5 w-full rounded bg-gray-200" />
                <div className="h-3.5 w-11/12 rounded bg-gray-200" />
                <div className="h-3.5 w-3/4 rounded bg-gray-200" />
                <div className="h-3.5 w-4/5 rounded bg-gray-200" />
              </div>
            ) : (
              <textarea
                ref={featuresRef}
                value={mainFeatures}
                onChange={(e) => setMainFeatures(e.target.value)}
                rows={1}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            )}
          </div>

          {/* 배포 링크 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">배포된 사이트</label>
            {isLoadingRepoData ? (
              <div className="animate-pulse h-10 w-full rounded-lg bg-gray-200" />
            ) : (
              <input
                type="url"
                value={deployUrl}
                onChange={(e) => setDeployUrl(e.target.value)}
                placeholder="https://..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            )}
          </div>

          {/* 기술 스택 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">기술 스택</label>
            {isLoadingRepoData ? (
              <div className="animate-pulse flex flex-wrap gap-2 min-h-10.5 rounded-lg border border-gray-200 px-3 py-2">
                <div className="h-7 w-20 rounded-full bg-gray-200" />
                <div className="h-7 w-16 rounded-full bg-gray-200" />
                <div className="h-7 w-24 rounded-full bg-gray-200" />
              </div>
            ) : (
              <SkillPicker
                selected={selectedSkills}
                onChange={(skills) => {
                  setSelectedSkills(skills);
                  setTechStack(skills.map((s) => s.name));
                }}
              />
            )}
          </div>

          {/* 추천 썸네일 */}
          <div className="space-y-3">
            <label className="text-sm font-medium">추천 썸네일</label>

            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
              {!thumbnailUrl && !isThumbnailLoading && (
                <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl">
                    🖼️
                  </div>
                  <span className="text-sm">AI가 생성한 썸네일 미리보기</span>
                </div>
              )}

              {isThumbnailLoading && (
                <div className="absolute inset-0 z-10 flex animate-pulse flex-col items-start justify-end gap-3 p-6">
                  <div className="h-3 w-20 rounded-full bg-gray-300" />
                  <div className="h-8 w-2/3 rounded-lg bg-gray-300" />
                  <div className="flex gap-2">
                    <div className="h-6 w-16 rounded-md bg-gray-300" />
                    <div className="h-6 w-16 rounded-md bg-gray-300" />
                    <div className="h-6 w-16 rounded-md bg-gray-300" />
                  </div>
                </div>
              )}

              {thumbnailUrl && (
                <>
                  <Image
                    key={thumbnailUrl}
                    src={thumbnailUrl}
                    alt="썸네일 미리보기"
                    fill
                    unoptimized
                    sizes="(max-width: 672px) 100vw, 672px"
                    className={`object-cover transition-opacity duration-300 ${
                      isThumbnailLoading ? "opacity-0" : "opacity-100"
                    }`}
                    onLoad={() => setIsThumbnailLoading(false)}
                    onError={() => {
                      setIsThumbnailLoading(false);
                      setThumbnailUrl("");
                    }}
                  />
                  {!isThumbnailLoading && (
                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-5">
                      {projectName && (
                        <p className="text-white font-bold text-xl leading-tight drop-shadow">
                          {projectName}
                        </p>
                      )}
                      {selectedSkills.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {selectedSkills.slice(0, 5).map((skill) => (
                            <span
                              key={skill.id}
                              className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm"
                            >
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleThumbnailFileChange}
            />
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={handleGenerateThumbnail}
                disabled={!projectName || isThumbnailLoading}
                className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isThumbnailLoading ? "생성 중..." : "AI 썸네일 재생성"}
              </button>
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                disabled={isThumbnailLoading}
                className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                직접 업로드
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 추가 자료 링크 */}
      <section className="border border-gray-200 rounded-2xl p-6 space-y-4 bg-white">
        <div>
          <h2 className="text-base font-semibold">추가 자료 링크</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            ERD, Figma 등 외부 링크를 붙여넣어 게시물에 표시합니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {UPLOAD_SECTIONS.map((section) => {
            const linked = !!uploadLinks[section.id];
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => openUploadModal(section.id)}
                className={`border rounded-2xl p-5 flex flex-col items-center gap-2 text-center bg-white transition-colors ${
                  linked
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-xs font-bold ${
                    linked
                      ? "border-blue-400 text-blue-500"
                      : "border-gray-200 text-gray-400"
                  }`}
                >
                  {linked ? "✓" : section.label}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">{section.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{section.subtitle}</p>
                </div>
                <p className="text-xs mt-1 truncate max-w-full px-2">
                  {linked ? (
                    <span className="text-blue-500">{uploadLinks[section.id]}</span>
                  ) : (
                    <span className="text-gray-400">클릭하여 링크 추가</span>
                  )}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 태그 */}
      <section className="border border-gray-200 rounded-2xl p-6 space-y-3 bg-white">
        <div>
          <h2 className="text-base font-semibold">태그</h2>
          <p className="text-sm text-gray-500 mt-0.5">Enter 또는 쉼표로 태그를 추가하세요.</p>
        </div>

        <div className="flex flex-wrap gap-2 min-h-10 rounded-lg border border-gray-300 px-3 py-2 focus-within:ring-2 focus-within:ring-gray-200">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
            >
              {tag}
              <button
                type="button"
                onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                className="text-gray-400 hover:text-gray-700 leading-none"
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder={tags.length === 0 ? "예: React, 포트폴리오, 팀프로젝트" : ""}
            className="flex-1 min-w-24 text-sm outline-none bg-transparent placeholder:text-gray-400"
          />
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
            <label htmlFor="teamRecruit" className="text-base font-semibold cursor-pointer">
              팀원 모집
            </label>
          </div>
          <p className="text-sm text-gray-500 mt-1.5 pl-7">
            팀원 모집 기능을 설정하고 지원을 받아보세요.
          </p>
        </div>

        {teamRecruitEnabled && (
          <div className="space-y-4 border-t border-gray-200 pt-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">프로젝트 설명</label>
              <textarea
                ref={recruitRef}
                value={recruitDescription}
                onChange={(e) => setRecruitDescription(e.target.value)}
                placeholder="프로젝트에 대해 설명해주세요"
                rows={1}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none overflow-hidden placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">모집 역할 선택</label>
              <div className="flex gap-2">
                {RECRUIT_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
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
          </div>
        )}
      </section>

      {/* 게시글 등록 버튼 */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || !projectName}
        className="w-full bg-black text-white py-4 rounded-xl font-semibold text-base hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "등록 중..." : "게시글 등록"}
      </button>

      {/* 링크 입력 모달 */}
      {activeUpload && activeSection && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setActiveUpload(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-semibold">{activeSection.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{activeSection.subtitle}</p>
            </div>
            <input
              type="url"
              value={tempLink}
              onChange={(e) => setTempLink(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveLink(); }}
              placeholder="https://..."
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveLink}
                className="flex-1 bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-900"
              >
                저장
              </button>
              {uploadLinks[activeUpload] && (
                <button
                  type="button"
                  onClick={() => {
                    setUploadLinks((prev) => ({ ...prev, [activeUpload]: "" }));
                    setActiveUpload(null);
                  }}
                  className="px-4 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50"
                >
                  삭제
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveUpload(null)}
                className="px-4 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
