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

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

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
    // if (repo) project.handleLoadInfo(repo); //백 연결시
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
        // repos={github.repos} //백 연결시
        // selectedRepo={github.selectedRepo} //백 연결시
        // isLoadingRepos={github.isLoadingRepos} //백 연결시
        // isGithubConnected={github.isGithubConnected} //백 연결시
        // isCheckingGithub={github.isCheckingGithub} //백 연결시
         repos={[{ name: "Gyohak1Team", fullName: "T1-hotae/Gyohak1Team" }]} //백 연결 X
         selectedRepo={github.selectedRepo || "T1-hotae/Gyohak1Team"} //백 연결 X
         isLoadingRepos={false} //백 연결 X
         isGithubConnected={true} //백 연결 X
         isCheckingGithub={false} //백 연결 X
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
          // await project.handleLoadInfo(github.selectedRepo, true);
          // setIsAiModalOpen(true); //백 연결시
          // 밑 강제연결
          project.setProjectName("Gyohak1Team"); //백 연결 X
          project.setProjectDescription( //백 연결 X
          "교학팀의 핵심 업무 중 하나인 강의실 점검표를 자동으로 생성하는 사이트입니다."); //백 연결 X
          project.setMainFeatures("강의실 점검표 자동 생성, 데이터 저장, 관리자 확인"); //백 연결 X
          project.setDeployUrl("https://gyohak1-team.vercel.app"); //백 연결 X
          setIsAiModalOpen(true); //백 연결 X
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
        className="w-full bg-black text-white py-4 rounded-xl font-semibold text-base hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {isSubmitting ? "등록 중..." : "게시글 등록"}
      </button>
    </div>
  );
}
