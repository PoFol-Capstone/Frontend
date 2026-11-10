"use client";
import type { Skill } from "@/types/skill";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import Field from "@/components/ui/Field";
import SkillPicker from "./SkillPicker";
import VideoField from "./VideoField";

type Props = {
  projectName: string;
  onProjectNameChange: (v: string) => void;
  projectDescription: string;
  onProjectDescriptionChange: (v: string) => void;
  mainFeatures: string;
  onMainFeaturesChange: (v: string) => void;
  deployUrl: string;
  onDeployUrlChange: (v: string) => void;
  videoUrl: string;
  onVideoUrlChange: (v: string) => void;
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
  videoUrl,
  onVideoUrlChange,
  selectedSkills,
  onSkillsChange,
  isLoadingRepoData,
  isAIWriting,
}: Props) {
  const t = useTranslations("board.write.projectInfo");
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
    <div className="space-y-6">
      <Field label={t("name")}>
        {isLoadingRepoData ? (
          <div className="h-12 w-full animate-pulse rounded-xl bg-gray-200" />
        ) : (
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            className="input"
          />
        )}
      </Field>

      <Field label={t("description")}>
        {isLoadingRepoData || isAIWriting ? (
          <div className="min-h-28 animate-pulse space-y-2 rounded-xl border border-gray-200 px-4 py-3">
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
            className="input resize-none overflow-hidden"
          />
        )}
      </Field>

      <Field label={t("mainFeatures")}>
        {isLoadingRepoData || isAIWriting ? (
          <div className="min-h-28 animate-pulse space-y-2 rounded-xl border border-gray-200 px-4 py-3">
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
            className="input resize-none overflow-hidden"
          />
        )}
      </Field>

      <Field label={t("deployUrl")}>
        {isLoadingRepoData ? (
          <div className="h-12 w-full animate-pulse rounded-xl bg-gray-200" />
        ) : (
          <input
            type="url"
            value={deployUrl}
            onChange={(e) => onDeployUrlChange(e.target.value)}
            placeholder="https://..."
            className="input"
          />
        )}
      </Field>

      <VideoField value={videoUrl} onChange={onVideoUrlChange} />

      <Field label={t("techStack")}>
        {isLoadingRepoData ? (
          <div className="flex min-h-12 animate-pulse flex-wrap gap-2 rounded-xl border border-gray-200 px-4 py-2">
            <div className="h-7 w-20 rounded-full bg-gray-200" />
            <div className="h-7 w-16 rounded-full bg-gray-200" />
            <div className="h-7 w-24 rounded-full bg-gray-200" />
          </div>
        ) : (
          <SkillPicker selected={selectedSkills} onChange={onSkillsChange} />
        )}
      </Field>
    </div>
  );
}
