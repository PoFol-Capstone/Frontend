"use client";

import { createPost } from "@/lib/post";
import type { PostLink } from "@/types/post";
import { LinkType, PostType } from "@/types/post";
import { useRouter } from "next/navigation";
import { useState } from "react";
import GithubSection from "./_components/GithubSection";
import ProjectInfoSection from "./_components/ProjectInfoSection";
import TagsSection from "./_components/TagsSection";
import TeamRecruitSection from "./_components/TeamRecruitSection";
import UploadLinksSection, {
  type UploadSectionId,
} from "./_components/UploadLinksSection";
import { useGithubRepos } from "./_hooks/useGithubRepos";
import { useProjectForm } from "./_hooks/useProjectForm";

export default function Page() {
  const router = useRouter();
  const github = useGithubRepos();
  const project = useProjectForm();

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const [tags, setTags] = useState<string[]>([]);
  const [uploadLinks, setUploadLinks] = useState<
    Record<UploadSectionId, string>
  >({
    erd: "",
    figma: "",
    class: "",
    extra: "",
  });
  const [teamRecruitEnabled, setTeamRecruitEnabled] = useState(false);
  const [recruitDescription, setRecruitDescription] = useState("");
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const hasProject = !!project.projectName.trim();

  const hasRecruit =
    teamRecruitEnabled && !!recruitDescription.trim();

  const canSubmit = hasProject || hasRecruit;

  const selectedRoles = Object.entries(roleCounts)
  .filter(([, count]) => count > 0)
  .map(([role]) => role);

  const recruitTitle =
    selectedRoles.length > 0
      ? `${selectedRoles.join(" · ")} 모집중`
      : "모집중";
  
  const postTitle = hasProject
    ? project.projectName
    : recruitTitle;

  const handleRepoChange = (repo: string) => {
    github.setSelectedRepo(repo);
    if (repo) project.handleLoadInfo(repo);
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
          ? [
              {
                type: LinkType.GITHUB,
                url: `https://github.com/${github.selectedRepo}`,
              },
            ]
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
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <h1 className="text-2xl font-bold">프로젝트 등록</h1>

      <TeamRecruitSection
        enabled={teamRecruitEnabled}
        onEnabledChange={setTeamRecruitEnabled}
        description={recruitDescription}
        onDescriptionChange={setRecruitDescription}
        roleCounts={roleCounts}
        onRoleCountsChange={setRoleCounts}
      />

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
        onAILoad={async () => {
          if (project.projectName) {
            setIsAiModalOpen(true);
            return;
          }
          await project.handleLoadInfo(github.selectedRepo, true);
          setIsAiModalOpen(true);
        }}
        onGithubConnect={github.handleGithubConnect}
      />

      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4">
          <div className="relative max-h-[85vh] w-full max-w-3xl overflow-y-auto border-0 shadow-none p-0">
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
              onClose={() => setIsAiModalOpen(false)}
            />
          </div>
        </div>
      )}

      <TagsSection tags={tags} onChange={setTags} />

      <UploadLinksSection
        uploadLinks={uploadLinks}
        onChange={(id, url) =>
          setUploadLinks((prev) => ({ ...prev, [id]: url }))
        }
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || !canSubmit}
        className="w-full bg-black text-white py-4 rounded-xl font-semibold text-base hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "등록 중..." : "게시글 등록"}
      </button>
    </div>
  );
}
