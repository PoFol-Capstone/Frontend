"use client";

import SkillPicker from "@/app/board/write/_components/SkillPicker";
import TagsSection from "@/app/board/write/_components/TagsSection";
import TeamRecruitSection from "@/app/board/write/_components/TeamRecruitSection";
import UploadLinksSection, {
  type UploadSectionId,
} from "@/app/board/write/_components/UploadLinksSection";
import { updatePost } from "@/lib/post";
import type { PostLink, ResponsePosts } from "@/types/post";
import { LinkType, PostType } from "@/types/post";
import type { Skill } from "@/types/skill";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type Props = { post: ResponsePosts };

export default function EditPostClient({ post }: Props) {
  const router = useRouter();

  const [descriptionInit, featuresInit] = post.content.split(
    "\n\n## 주요 기능\n",
  );

  const [title, setTitle] = useState(post.title);
  const [projectDescription, setProjectDescription] = useState(
    descriptionInit ?? "",
  );
  const [mainFeatures, setMainFeatures] = useState(featuresInit ?? "");
  const [deployUrl, setDeployUrl] = useState(
    post.links?.find((l) => l.type === LinkType.DEPLOY)?.url ?? "",
  );
  const [uploadLinks, setUploadLinks] = useState<Record<UploadSectionId, string>>({
    figma: post.links?.find((l) => l.type === LinkType.FIGMA)?.url ?? "",
    erd: post.links?.find((l) => l.type === LinkType.ERD)?.url ?? "",
    class: post.links?.find((l) => l.type === LinkType.CLASS)?.url ?? "",
    extra: post.links?.find((l) => l.type === LinkType.EXTRA)?.url ?? "",
  });
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>(post.skills);
  const [tags, setTags] = useState<string[]>(post.tags);
  const [teamRecruitEnabled, setTeamRecruitEnabled] = useState(
    post.postType === PostType.RECRUIT,
  );
  const [recruitDescription, setRecruitDescription] = useState(
    post.recruitNote ?? "",
  );
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>(() => {
    const result: Record<string, number> = {};
    post.recruitPositionInfos.forEach((p) => {
      const display =
        p.positionType.charAt(0) + p.positionType.slice(1).toLowerCase();
      result[display] = p.maxCount;
    });
    return result;
  });
  const [thumbnailUrl, setThumbnailUrl] = useState(post.thumbnailUrl ?? "");
  const [isThumbnailLoading, setIsThumbnailLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const githubLink = post.links?.find((l) => l.type === LinkType.GITHUB);

  const handleThumbnailFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsThumbnailLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload/thumbnail", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setThumbnailUrl(data.url ?? "");
    } catch {
      // 업로드 실패 무시
    } finally {
      setIsThumbnailLoading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!title) return;
    setIsSubmitting(true);
    try {
      const content = [
        projectDescription,
        mainFeatures ? `## 주요 기능\n${mainFeatures}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      const links: PostLink[] = [
        ...(githubLink ? [githubLink] : []),
        ...(deployUrl ? [{ type: LinkType.DEPLOY, url: deployUrl }] : []),
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

      await updatePost(post.uuid, {
        title,
        content,
        thumbnailUrl: thumbnailUrl || null,
        type: teamRecruitEnabled ? PostType.RECRUIT : PostType.DISPLAY,
        links,
        recruitNote: recruitDescription,
        recruitPositions: Object.entries(roleCounts).map(([role, count]) => ({
          positionType: role.toUpperCase(),
          maxCount: count,
        })),
        isPublished: post.isPublished,
        skillIds: selectedSkills.map((s) => s.id),
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
      <h1 className="text-2xl font-bold">게시글 수정</h1>

      <section className="border border-gray-200 rounded-2xl p-6 space-y-5 bg-white">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">프로젝트 이름</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">프로젝트 설명</label>
          <textarea
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">주요 기능</label>
          <textarea
            value={mainFeatures}
            onChange={(e) => setMainFeatures(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>

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

        <div className="space-y-1.5">
          <label className="text-sm font-medium">기술 스택</label>
          <SkillPicker selected={selectedSkills} onChange={setSelectedSkills} />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">썸네일</label>
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
            {!thumbnailUrl && (
              <span className="text-sm text-gray-400">썸네일 없음</span>
            )}
            {thumbnailUrl && (
              <Image
                src={thumbnailUrl}
                alt="썸네일 미리보기"
                fill
                unoptimized
                sizes="(max-width: 672px) 100vw, 672px"
                className="object-cover"
              />
            )}
          </div>
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleThumbnailFileChange}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => thumbnailInputRef.current?.click()}
              disabled={isThumbnailLoading}
              className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              {isThumbnailLoading ? "업로드 중..." : "썸네일 변경"}
            </button>
            {thumbnailUrl && (
              <button
                type="button"
                onClick={() => setThumbnailUrl("")}
                className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                썸네일 삭제
              </button>
            )}
          </div>
        </div>
      </section>

      <UploadLinksSection
        uploadLinks={uploadLinks}
        onChange={(id, url) =>
          setUploadLinks((prev) => ({ ...prev, [id]: url }))
        }
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

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-xl border border-gray-300 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !title}
          className="flex-1 rounded-xl bg-black py-4 text-base font-semibold text-white hover:bg-gray-900 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "수정 중..." : "수정 완료"}
        </button>
      </div>
    </div>
  );
}
