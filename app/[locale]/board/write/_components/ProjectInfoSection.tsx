"use client";
import type { Skill } from "@/types/skill";
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
  isLoadingRepoData: boolean;
  isAIWriting: boolean;
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
  isLoadingRepoData,
  isAIWriting,
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
    <div className="space-y-5">
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
            className="w-full resize-none overflow-hidden rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
          />
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold">프로젝트 설명</label>
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
        <label className="text-sm font-semibold">주요 기능</label>
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
        <label className="text-sm font-semibold">배포된 사이트</label>
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
        <label className="text-sm font-semibold">기술 스택</label>
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
    </div>
  );
}
