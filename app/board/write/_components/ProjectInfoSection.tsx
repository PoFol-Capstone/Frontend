"use client";
import type { Skill } from "@/types/skill";
import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import SkillPicker from "./SkillPicker";

type Props = {
  projectName: string;
  onProjectNameChange: (v: string) => void;
  projectDescription: string;
  onProjectDescriptionChange: (v: string) => void;
  mainFeatures: string;
  onMainFeaturesChange: (v: string) => void;
  deployUrl: string;
  onDeployUrlChange: (v: string) => void;
  selectedSkills: Skill[];
  onSkillsChange: (skills: Skill[]) => void;
  thumbnailUrl: string;
  isThumbnailLoading: boolean;
  isLoadingRepoData: boolean;
  isAIWriting: boolean;
  onGenerateThumbnail: () => void;
  onThumbnailFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onThumbnailLoad: () => void;
  onThumbnailError: () => void;
  thumbnailInputRef: React.RefObject<HTMLInputElement | null>;

  onClose: () => void;
};

export default function ProjectInfoSection({
  projectName,
  onProjectNameChange,
  projectDescription,
  onProjectDescriptionChange,
  mainFeatures,
  onMainFeaturesChange,
  deployUrl,
  onDeployUrlChange,
  selectedSkills,
  onSkillsChange,
  thumbnailUrl,
  isThumbnailLoading,
  isLoadingRepoData,
  isAIWriting,
  onGenerateThumbnail,
  onThumbnailFileChange,
  onThumbnailLoad,
  onThumbnailError,
  thumbnailInputRef,
  onClose,
}: Props) {
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const featuresRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = (ref: React.RefObject<HTMLTextAreaElement | null>) => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  useEffect(() => {
    resizeTextarea(descriptionRef);
  }, [projectDescription]);
  useEffect(() => {
    resizeTextarea(featuresRef);
  }, [mainFeatures]);
  useEffect(() => {
    if (!isLoadingRepoData && !isAIWriting) {
      resizeTextarea(descriptionRef);
      resizeTextarea(featuresRef);
    }
  }, [isLoadingRepoData, isAIWriting]);

  return (
    <section className="relative border border-gray-200 rounded-2xl p-6 space-y-5 bg-white">
      <div className="mb-1 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">AI 분석 결과</h2>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
            수정 가능
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          // onClick={() => setIsAiModalOpen(false)}
          className="text-gray-400 hover:text-black"
        >
          <X size={22} />
        </button>
      </div>

      <div className="space-y-6">
         <label className="mb-2.5 block text-base font-semibold text-gray-900">
            프로젝트 이름
          </label>
          {isLoadingRepoData ? (
            <div className="h-13 w-full animate-pulse rounded-xl bg-gray-200" />
          ) : (
            <input
              type="text"
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              className="w-full resize-none overflow-hidden rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"/>
          )}
        </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">프로젝트 이름</label>
        {isLoadingRepoData ? (
          <div className="animate-pulse h-10 w-full rounded-lg bg-gray-200" />
        ) : (
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        )}
      </div>

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
            onChange={(e) => onProjectDescriptionChange(e.target.value)}
            rows={1}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        )}
      </div>

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
            onChange={(e) => onMainFeaturesChange(e.target.value)}
            rows={1}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">배포된 사이트</label>
        {isLoadingRepoData ? (
          <div className="animate-pulse h-10 w-full rounded-lg bg-gray-200" />
        ) : (
          <input
            type="url"
            value={deployUrl}
            onChange={(e) => onDeployUrlChange(e.target.value)}
            placeholder="https://..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">기술 스택</label>
        {isLoadingRepoData ? (
          <div className="animate-pulse flex flex-wrap gap-2 min-h-10.5 rounded-lg border border-gray-200 px-3 py-2">
            <div className="h-7 w-20 rounded-full bg-gray-200" />
            <div className="h-7 w-16 rounded-full bg-gray-200" />
            <div className="h-7 w-24 rounded-full bg-gray-200" />
          </div>
        ) : (
          <SkillPicker selected={selectedSkills} onChange={onSkillsChange} />
        )}
      </div>

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
                onLoad={onThumbnailLoad}
                onError={onThumbnailError}
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
          onChange={onThumbnailFileChange}
        />
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={onGenerateThumbnail}
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
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-900"
        >
          저장하기
        </button>
      </div>
    </section>
  );
}
