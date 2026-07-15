"use client";

import { createPost } from "@/lib/post";
import type { PostLink } from "@/types/post";
import { LinkType, PostType } from "@/types/post";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import Image from "next/image";
import { Monitor, Users, ImageIcon } from "lucide-react";
import ProjectInfoSection from "./_components/ProjectInfoSection";
import TagsSection from "./_components/TagsSection";
import TeamRecruitSection from "./_components/TeamRecruitSection";
import UploadLinksSection, {
  type UploadSectionId,
} from "./_components/UploadLinksSection";
import { useGithubRepos } from "./_hooks/useGithubRepos";
import { useProjectForm } from "./_hooks/useProjectForm";

type PostTypeSelection = "project" | "recruit" | null;

const STEPS = ["유형 선택", "내용 작성", "썸네일", "추가 정보"] as const;

export default function Page() {
  const router = useRouter();
  const github = useGithubRepos();
  const project = useProjectForm();

  const [currentStep, setCurrentStep] = useState(1);
  const [postTypeSelection, setPostTypeSelection] =
    useState<PostTypeSelection>(null);

  const [tags, setTags] = useState<string[]>([]);
  const [uploadLinks, setUploadLinks] = useState<
    Record<UploadSectionId, string>
  >({ erd: "", figma: "", class: "", extra: "" });
  const [teamRecruitEnabled, setTeamRecruitEnabled] = useState(false);
  const [recruitDescription, setRecruitDescription] = useState("");
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRecruit = postTypeSelection === "recruit";
  const hasProject = !!project.projectName.trim();
  const hasRecruit = isRecruit && !!recruitDescription.trim();
  const canSubmit = hasProject || hasRecruit;

  const step1Valid =
    postTypeSelection !== null && (!isRecruit || !!recruitDescription.trim());
  const step2Valid = isRecruit || hasProject;

  const githubUrl = github.selectedRepo
    ? `https://github.com/${github.selectedRepo}`
    : "";

  const selectedRoles = Object.entries(roleCounts)
    .filter(([, count]) => count > 0)
    .map(([role]) => role);

  const recruitTitle =
    selectedRoles.length > 0
      ? `${selectedRoles.join(" · ")} 모집중`
      : "모집중";

  const postTitle = hasProject ? project.projectName : recruitTitle;

  const handleTypeSelect = (type: PostTypeSelection) => {
    setPostTypeSelection(type);
    setTeamRecruitEnabled(type === "recruit");
  };

  const handleRepoChange = (repo: string) => {
    github.setSelectedRepo(repo);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const projectcontent = [
        project.projectDescription,
        project.mainFeatures ? `## 주요 기능\n${project.mainFeatures}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      const links: PostLink[] = [
        ...(github.selectedRepo
          ? [{ type: LinkType.GITHUB, url: githubUrl }]
          : []),
        ...(project.deployUrl
          ? [{ type: LinkType.DEPLOY, url: project.deployUrl }]
          : []),
        ...(uploadLinks.figma
          ? [{ type: LinkType.FIGMA, url: uploadLinks.figma }]
          : []),
        ...(uploadLinks.erd
          ? [{ type: LinkType.ERD, url: uploadLinks.erd }]
          : []),
        ...(uploadLinks.class
          ? [{ type: LinkType.CLASS, url: uploadLinks.class }]
          : []),
        ...(uploadLinks.extra
          ? [{ type: LinkType.EXTRA, url: uploadLinks.extra }]
          : []),
      ];

      const post = await createPost({
        title: postTitle,
        content: hasProject ? projectcontent : recruitDescription,
        thumbnailUrl: project.thumbnailUrl || null,
        type: teamRecruitEnabled ? PostType.RECRUIT : PostType.DISPLAY,
        links,
        recruitNote: recruitDescription,
        recruitPositions: Object.entries(roleCounts).map(([role, count]) => ({
          positionType: role.toUpperCase(),
          maxCount: count,
        })),
        isPublished: true,
        skillIds: project.selectedSkills.map((s) => s.id),
        tagNames: tags,
      });
      router.push(`/board/${post.uuid}`);
    } catch {
      // 에러는 서버 로그에서 확인
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 스텝 인디케이터 */}
      <div className="mb-10 flex items-center">
        {STEPS.map((label, idx) => {
          const step = idx + 1;
          const isActive = currentStep === step;
          const isDone = currentStep > step;
          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    isDone || isActive
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isDone ? "✓" : step}
                </div>
                <span
                  className={`text-xs whitespace-nowrap ${isActive ? "font-semibold text-black" : "text-gray-400"}`}
                >
                  {label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-3 mb-5 transition-colors ${isDone ? "bg-black" : "bg-gray-200"}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: 유형 선택 ── */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold">어떤 게시글을 작성하시나요?</h2>
            <p className="mt-1 text-sm text-gray-500">
              게시글 유형을 선택해주세요.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleTypeSelect("project")}
              className={`rounded-2xl border-2 p-6 text-left transition-all ${
                postTypeSelection === "project"
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-white hover:border-gray-400"
              }`}
            >
              <Monitor size={28} className="mb-3" />
              <p className="font-bold text-base">프로젝트 전시</p>
              <p
                className={`mt-1 text-sm leading-5 ${postTypeSelection === "project" ? "text-gray-300" : "text-gray-500"}`}
              >
                완성된 프로젝트를 포트폴리오에 공개합니다
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleTypeSelect("recruit")}
              className={`rounded-2xl border-2 p-6 text-left transition-all ${
                postTypeSelection === "recruit"
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-white hover:border-gray-400"
              }`}
            >
              <Users size={28} className="mb-3" />
              <p className="font-bold text-base">팀원 모집</p>
              <p
                className={`mt-1 text-sm leading-5 ${postTypeSelection === "recruit" ? "text-gray-300" : "text-gray-500"}`}
              >
                함께할 팀원을 구하고 있습니다
              </p>
            </button>
          </div>

          {postTypeSelection === "recruit" && (
            <TeamRecruitSection
              enabled={true}
              onEnabledChange={setTeamRecruitEnabled}
              description={recruitDescription}
              onDescriptionChange={setRecruitDescription}
              roleCounts={roleCounts}
              onRoleCountsChange={setRoleCounts}
              hideToggle
            />
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={!step1Valid}
              className="rounded-xl bg-black px-8 py-3 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: 내용 작성 ── */}
      {currentStep === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold">프로젝트 정보를 입력해주세요</h2>
            <p className="mt-1 text-sm text-gray-500">
              GitHub로 자동완성하거나 직접 입력하세요.
            </p>
          </div>

          {/* 컴팩트 GitHub 자동완성 바 */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            {github.isCheckingGithub ? (
              <p className="text-xs text-gray-400 py-1">GitHub 연결 확인 중...</p>
            ) : !github.isGithubConnected ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-gray-500">
                  GitHub 연결 시 정보를 자동으로 불러올 수 있습니다.
                </p>
                <button
                  type="button"
                  onClick={github.handleGithubConnect}
                  disabled={github.isConnecting}
                  className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {github.isConnecting ? "연결 중..." : "GitHub 연결"}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  value={github.selectedRepo}
                  onChange={(e) => handleRepoChange(e.target.value)}
                  disabled={github.isLoadingRepos}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
                >
                  <option value="">
                    {github.isLoadingRepos
                      ? "불러오는 중..."
                      : "레포지토리 선택 (선택사항)"}
                  </option>
                  {Array.isArray(github.repos) &&
                    github.repos.map((repo) => (
                      <option key={repo.fullName} value={repo.fullName}>
                        {repo.name}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={async () => {
                    await project.handleLoadInfo(github.selectedRepo, true);
                  }}
                  disabled={
                    !github.selectedRepo ||
                    project.isLoadingRepoData ||
                    project.isAIWriting
                  }
                  className="shrink-0 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {project.isAIWriting
                    ? "AI 작성 중..."
                    : project.isLoadingRepoData
                      ? "불러오는 중..."
                      : "AI 자동완성"}
                </button>
              </div>
            )}
            {project.aiError && (
              <p className="mt-2 text-xs text-red-500">{project.aiError}</p>
            )}
          </div>

          {/* 프로젝트 폼 */}
          <section className="border border-gray-200 rounded-2xl p-6 space-y-5 bg-white">
            <ProjectInfoSection
              projectName={project.projectName}
              onProjectNameChange={project.setProjectName}
              projectDescription={project.projectDescription}
              onProjectDescriptionChange={project.setProjectDescription}
              mainFeatures={project.mainFeatures}
              onMainFeaturesChange={project.setMainFeatures}
              deployUrl={project.deployUrl}
              onDeployUrlChange={project.setDeployUrl}
              selectedSkills={project.selectedSkills}
              onSkillsChange={project.handleSkillsChange}
              isLoadingRepoData={project.isLoadingRepoData}
              isAIWriting={project.isAIWriting}
            />
          </section>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="rounded-xl border border-gray-300 px-8 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              이전
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              disabled={!step2Valid}
              className="rounded-xl bg-black px-8 py-3 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: 썸네일 ── */}
      {currentStep === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold">썸네일을 설정해주세요</h2>
            <p className="mt-1 text-sm text-gray-500">
              AI로 생성하거나 직접 업로드할 수 있습니다.
            </p>
          </div>

          <section className="border border-gray-200 rounded-2xl p-6 space-y-4 bg-white">
            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
              {!project.thumbnailUrl && !project.isThumbnailLoading && (
                <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400">
                    <ImageIcon size={22} />
                  </div>
                  <span className="text-sm">AI가 생성한 썸네일 미리보기</span>
                </div>
              )}

              {project.isThumbnailLoading && (
                <div className="absolute inset-0 z-10 flex animate-pulse flex-col items-start justify-end gap-3 p-6">
                  <div className="h-3 w-20 rounded-full bg-gray-300" />
                  <div className="h-8 w-2/3 rounded-lg bg-gray-300" />
                  <div className="flex gap-2">
                    <div className="h-6 w-16 rounded-md bg-gray-300" />
                    <div className="h-6 w-16 rounded-md bg-gray-300" />
                  </div>
                </div>
              )}

              {project.thumbnailUrl && (
                <>
                  <Image
                    key={project.thumbnailUrl}
                    src={project.thumbnailUrl}
                    alt="썸네일 미리보기"
                    fill
                    unoptimized
                    sizes="(max-width: 672px) 100vw, 672px"
                    className={`object-cover transition-opacity duration-300 ${
                      project.isThumbnailLoading ? "opacity-0" : "opacity-100"
                    }`}
                    onLoad={project.handleThumbnailLoad}
                    onError={project.handleThumbnailError}
                  />
                  {!project.isThumbnailLoading && (
                    <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/70 via-black/20 to-transparent p-5">
                      {project.projectName && (
                        <p className="text-white font-bold text-xl leading-tight drop-shadow">
                          {project.projectName}
                        </p>
                      )}
                      {project.selectedSkills.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {project.selectedSkills.slice(0, 5).map((skill) => (
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
              ref={project.thumbnailInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={project.handleThumbnailFileChange}
            />
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={project.handleGenerateThumbnail}
                disabled={!project.projectName || project.isThumbnailLoading}
                className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {project.isThumbnailLoading ? "생성 중..." : "AI 썸네일 생성"}
              </button>
              <button
                type="button"
                onClick={() => project.thumbnailInputRef.current?.click()}
                disabled={project.isThumbnailLoading}
                className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                직접 업로드
              </button>
            </div>
          </section>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="rounded-xl border border-gray-300 px-8 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              이전
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="rounded-xl bg-black px-8 py-3 text-sm font-semibold text-white hover:bg-gray-900 transition-colors"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: 추가 정보 ── */}
      {currentStep === 4 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold">추가 정보를 입력해주세요</h2>
            <p className="mt-1 text-sm text-gray-500">
              태그와 자료 링크는 선택사항입니다.
            </p>
          </div>

          <TagsSection tags={tags} onChange={setTags} />

          <UploadLinksSection
            uploadLinks={uploadLinks}
            onChange={(id, url) =>
              setUploadLinks((prev) => ({ ...prev, [id]: url }))
            }
            githubUrl={githubUrl}
          />

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="rounded-xl border border-gray-300 px-8 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              이전
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !canSubmit}
              className="rounded-xl bg-black px-8 py-3 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "등록 중..." : "게시글 등록"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
