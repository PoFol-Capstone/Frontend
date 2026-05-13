"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/lib/post";
import { LinkType, PostType } from "@/types/post";
import type { PostLink } from "@/types/post";
import { useGithubRepos } from "./_hooks/useGithubRepos";
import { useProjectForm } from "./_hooks/useProjectForm";
import GithubSection from "./_components/GithubSection";
import ProjectInfoSection from "./_components/ProjectInfoSection";
import UploadLinksSection, { type UploadSectionId } from "./_components/UploadLinksSection";
import TagsSection from "./_components/TagsSection";
import TeamRecruitSection from "./_components/TeamRecruitSection";

export default function Page() {
  const router = useRouter();
  const github = useGithubRepos();
  const project = useProjectForm();

  const [tags, setTags] = useState<string[]>([]);
  const [uploadLinks, setUploadLinks] = useState<Record<UploadSectionId, string>>({
    erd: "", figma: "", class: "", extra: "",
  });
  const [teamRecruitEnabled, setTeamRecruitEnabled] = useState(false);
  const [recruitDescription, setRecruitDescription] = useState("");
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRepoChange = (repo: string) => {
    github.setSelectedRepo(repo);
    if (repo) project.handleLoadInfo(repo);
  };

  const handleSubmit = async () => {
    if (!project.projectName) return;
    setIsSubmitting(true);
    try {
      const content = [
        project.projectDescription,
        project.mainFeatures ? `## 주요 기능\n${project.mainFeatures}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      const links: PostLink[] = [
        ...(github.selectedRepo
          ? [{ type: LinkType.GITHUB, url: `https://github.com/${github.selectedRepo}` }]
          : []),
        ...(project.deployUrl ? [{ type: LinkType.DEPLOY, url: project.deployUrl }] : []),
        ...(uploadLinks.figma ? [{ type: LinkType.FIGMA, url: uploadLinks.figma }] : []),
        ...(uploadLinks.erd ? [{ type: LinkType.ERD, url: uploadLinks.erd }] : []),
        ...(uploadLinks.class ? [{ type: LinkType.CLASS, url: uploadLinks.class }] : []),
        ...(uploadLinks.extra ? [{ type: LinkType.EXTRA, url: uploadLinks.extra }] : []),
      ];

      const post = await createPost({
        title: project.projectName,
        content,
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
    }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <h1 className="text-2xl font-bold">프로젝트 등록</h1>

      <GithubSection
        repos={github.repos}
        selectedRepo={github.selectedRepo}
        isLoadingRepos={github.isLoadingRepos}
        isGithubConnected={github.isGithubConnected}
        isCheckingGithub={github.isCheckingGithub}
        isLoadingRepoData={project.isLoadingRepoData}
        isAIWriting={project.isAIWriting}
        aiError={project.aiError}
        onRepoChange={handleRepoChange}
        onLoadInfo={() => project.handleLoadInfo(github.selectedRepo)}
        onAILoad={() => project.handleLoadInfo(github.selectedRepo, true)}
        onGithubConnect={github.handleGithubConnect}
      />

      {github.isGithubConnected && github.selectedRepo && (
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
          thumbnailUrl={project.thumbnailUrl}
          isThumbnailLoading={project.isThumbnailLoading}
          isLoadingRepoData={project.isLoadingRepoData}
          isAIWriting={project.isAIWriting}
          onGenerateThumbnail={project.handleGenerateThumbnail}
          onThumbnailFileChange={project.handleThumbnailFileChange}
          onThumbnailLoad={project.handleThumbnailLoad}
          onThumbnailError={project.handleThumbnailError}
          thumbnailInputRef={project.thumbnailInputRef}
        />
      )}

      <UploadLinksSection
        uploadLinks={uploadLinks}
        onChange={(id, url) => setUploadLinks((prev) => ({ ...prev, [id]: url }))}
      />

      <TagsSection tags={tags} onChange={setTags} />

      <TeamRecruitSection
        enabled={teamRecruitEnabled}
        onEnabledChange={setTeamRecruitEnabled}
        description={recruitDescription}
        onDescriptionChange={setRecruitDescription}
        roleCounts={roleCounts}
        onRoleCountsChange={setRoleCounts}
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || !project.projectName}
        className="w-full bg-black text-white py-4 rounded-xl font-semibold text-base hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "등록 중..." : "게시글 등록"}
      </button>
    </div>
  );
}
