"use client";

import SkillPicker from "@/app/[locale]/board/write/_components/SkillPicker";
import TagsSection from "@/app/[locale]/board/write/_components/TagsSection";
import TeamRecruitSection from "@/app/[locale]/board/write/_components/TeamRecruitSection";
import UploadLinksSection, {
  type UploadSectionId,
} from "@/app/[locale]/board/write/_components/UploadLinksSection";
import { updatePost } from "@/lib/post";
import { buildEditedContent, splitPostContent } from "@/lib/postContent";
import {
  hasValidRecruitPositions,
  toRecruitPositionRequests,
  toRoleCounts,
} from "@/lib/recruitPositions";
import {
  thumbnailErrorMessage,
  uploadThumbnailFile,
} from "@/lib/thumbnailClient";
import { THUMBNAIL_ACCEPT } from "@/lib/uploadLimits";
import type { PostLink, ResponsePosts } from "@/types/post";
import { LinkType, PostType } from "@/types/post";
import type { Skill } from "@/types/skill";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

type Props = { post: ResponsePosts };

export default function EditPostClient({ post }: Props) {
  const t = useTranslations("board.edit");
  const tThumbnail = useTranslations("board.thumbnail");
  const tRecruit = useTranslations("board.write.teamRecruit");
  const router = useRouter();

  // 첫 구분자에서만 나눈다 — 구분자가 여러 번 있어도 뒤쪽 내용이 편집 화면에서 사라지지 않는다
  const initialContent = splitPostContent(post.content);
  // 게시글 유형은 바꿀 수 없다: 백엔드 UpdatePostRequest·Post.update가 type을 받지 않는다
  const isRecruit = post.postType === PostType.RECRUIT;

  const [title, setTitle] = useState(post.title);
  const [projectDescription, setProjectDescription] = useState(
    initialContent.description,
  );
  const [mainFeatures, setMainFeatures] = useState(initialContent.features);
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
  const [recruitDescription, setRecruitDescription] = useState(
    post.recruitNote ?? "",
  );
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>(() =>
    toRoleCounts(post.recruitPositionInfos),
  );
  const [thumbnailUrl, setThumbnailUrl] = useState(post.thumbnailUrl ?? "");
  const [isThumbnailLoading, setIsThumbnailLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const githubLink = post.links?.find((l) => l.type === LinkType.GITHUB);
  const recruitPositionsValid = !isRecruit || hasValidRecruitPositions(roleCounts);

  const handleThumbnailFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    setError(null);
    setIsThumbnailLoading(true);
    try {
      // 성공했을 때만 교체한다 — 실패하면 기존 썸네일을 그대로 두고 사유를 보여준다
      const result = await uploadThumbnailFile(file);
      if (result.ok) {
        setThumbnailUrl(result.url);
      } else {
        const { key, values } = thumbnailErrorMessage(result);
        setError(tThumbnail(key, values));
      }
    } finally {
      setIsThumbnailLoading(false);
      input.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError(t("titleRequired"));
      return;
    }
    if (!recruitPositionsValid) {
      setError(tRecruit("positionsRequired"));
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      // 설명·기능을 고치지 않았으면(예: 제목만 수정) 원문을 그대로 보낸다
      let content = buildEditedContent(
        post.content,
        projectDescription,
        mainFeatures,
      );
      // 모집 전용 글은 본문이 모집 조건과 같은 값으로 저장된다(작성 화면 규칙).
      // 본문을 따로 고치지 않았다면 모집 조건 수정을 본문에도 반영해 둘이 어긋나지 않게 한다
      if (
        isRecruit &&
        content === post.content &&
        post.content.trim() !== "" &&
        post.content === (post.recruitNote ?? "")
      ) {
        content = recruitDescription;
      }

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
        title: title.trim(),
        content,
        thumbnailUrl: thumbnailUrl || null,
        links,
        // 일반 게시글은 모집 정보를 편집하지 않으므로 기존 값을 그대로 보낸다
        // (백엔드는 모집 정보·포지션을 요청 값으로 통째로 교체한다)
        recruitNote: isRecruit ? recruitDescription : (post.recruitNote ?? ""),
        recruitPositions: isRecruit
          ? toRecruitPositionRequests(roleCounts)
          : post.recruitPositionInfos.map((p) => ({
              positionType: p.positionType,
              maxCount: p.maxCount,
            })),
        isPublished: post.isPublished,
        skillIds: selectedSkills.map((s) => s.id),
        tagNames: tags,
      });

      router.push(`/board/${post.uuid}`);
    } catch (err) {
      // 예전엔 catch를 비워둬서 저장 실패가 화면상 아무 변화 없이 끝났다
      console.error("[edit] 게시글 수정 실패:", err);
      setError(t("saveFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
        {t("typeLocked", {
          type: isRecruit ? t("typeRecruit") : t("typeDisplay"),
        })}
      </p>

      <section className="border border-gray-200 rounded-2xl p-6 space-y-5 bg-white">
        <div className="space-y-1.5">
          <label htmlFor="edit-title" className="text-sm font-medium">
            {t("projectName")}
          </label>
          <input
            id="edit-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="edit-description" className="text-sm font-medium">
            {t("projectDescription")}
          </label>
          <textarea
            id="edit-description"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="edit-features" className="text-sm font-medium">
            {t("mainFeatures")}
          </label>
          <textarea
            id="edit-features"
            value={mainFeatures}
            onChange={(e) => setMainFeatures(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="edit-deploy-url" className="text-sm font-medium">
            {t("deployUrl")}
          </label>
          <input
            id="edit-deploy-url"
            type="url"
            value={deployUrl}
            onChange={(e) => setDeployUrl(e.target.value)}
            placeholder="https://..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("techStack")}</label>
          <SkillPicker selected={selectedSkills} onChange={setSelectedSkills} />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">{t("thumbnail")}</label>
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
            {!thumbnailUrl && (
              <span className="text-sm text-gray-400">{t("noThumbnail")}</span>
            )}
            {thumbnailUrl && (
              <Image
                src={thumbnailUrl}
                alt={t("thumbnailAlt")}
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
            accept={THUMBNAIL_ACCEPT}
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
              {isThumbnailLoading ? t("uploading") : t("changeThumbnail")}
            </button>
            {thumbnailUrl && (
              <button
                type="button"
                onClick={() => setThumbnailUrl("")}
                className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t("removeThumbnail")}
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

      {/* 유형 전환은 저장되지 않으므로 토글을 숨기고, 모집글일 때만 모집 정보를 편집한다 */}
      {isRecruit && (
        <TeamRecruitSection
          enabled
          hideToggle
          description={recruitDescription}
          onDescriptionChange={setRecruitDescription}
          roleCounts={roleCounts}
          onRoleCountsChange={setRoleCounts}
          positionsError={
            recruitPositionsValid ? null : tRecruit("positionsRequired")
          }
        />
      )}

      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-xl border border-gray-300 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !title.trim() || !recruitPositionsValid}
          className="flex-1 rounded-xl bg-black py-4 text-base font-semibold text-white hover:bg-gray-900 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? t("submitting") : t("submit")}
        </button>
      </div>
    </div>
  );
}
