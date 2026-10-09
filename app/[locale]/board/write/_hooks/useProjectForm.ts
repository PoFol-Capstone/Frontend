"use client";
import { useRef, useState } from "react";
import type { Skill } from "@/types/skill";
import { useTranslations } from "next-intl";
import {
  replaceThumbnail,
  requestAiThumbnail,
  thumbnailErrorMessage,
  uploadThumbnailFile,
  type ThumbnailFailure,
} from "@/lib/thumbnailClient";

export function useProjectForm() {
  const t = useTranslations("board.write.ai");
  const tThumbnail = useTranslations("board.thumbnail");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [mainFeatures, setMainFeatures] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [deployUrl, setDeployUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isThumbnailLoading, setIsThumbnailLoading] = useState(false);
  const [thumbnailError, setThumbnailError] = useState("");
  const [isLoadingRepoData, setIsLoadingRepoData] = useState(false);
  const [isAIWriting, setIsAIWriting] = useState(false);
  const [aiError, setAiError] = useState("");

  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const showThumbnailError = (failure: ThumbnailFailure | null) => {
    if (!failure) {
      setThumbnailError("");
      return;
    }
    const { key, values } = thumbnailErrorMessage(failure);
    setThumbnailError(tThumbnail(key, values));
  };

  // 성공했을 때만 URL을 바꾼다. 실패하면 기존 이미지(와 그걸 담은 임시 저장본)를 그대로 두고
  // 썸네일 단계에 사유를 보여준다 — 예전엔 요청 전에 URL을 지워서 실패하면 원래 이미지도 사라졌다.
  const runThumbnailReplacement = async (
    attempt: Parameters<typeof replaceThumbnail>[1],
  ) => {
    setIsThumbnailLoading(true);
    setThumbnailError("");
    try {
      const next = await replaceThumbnail(thumbnailUrl, attempt);
      setThumbnailUrl(next.url);
      showThumbnailError(next.error);
    } finally {
      setIsThumbnailLoading(false);
    }
  };

  const handleSkillsChange = (skills: Skill[]) => {
    setSelectedSkills(skills);
    setTechStack(skills.map((s) => s.name));
  };

  const handleLoadInfo = async (repo: string, forceAI = false) => {
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
          body: JSON.stringify({ projectName: name, readmeText: data.readmeText ?? "", techStack: stack }),
        });
        const aiData = await aiRes.json();
        if (!aiRes.ok) throw new Error(aiData.error ?? t("summarizeFailed"));
        setProjectDescription(aiData.projectDescription ?? "");
        setMainFeatures(aiData.mainFeatures ?? "");
        setIsAIWriting(false);

        // 썸네일 생성 실패는 요약 결과를 버리지 않고 썸네일 단계에서 알린다
        await runThumbnailReplacement(() =>
          requestAiThumbnail({
            projectName: name,
            techStack: stack,
            projectDescription: aiData.projectDescription ?? "",
            mainFeatures: aiData.mainFeatures ?? "",
          }),
        );
      }
    } catch (err) {
      setIsLoadingRepoData(false);
      setIsAIWriting(false);
      if (err instanceof Error) setAiError(err.message);
    }
  };

  const handleGenerateThumbnail = async () => {
    if (!projectName) return;
    await runThumbnailReplacement(() =>
      requestAiThumbnail({ projectName, techStack, projectDescription, mainFeatures }),
    );
  };

  const handleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    try {
      await runThumbnailReplacement(() => uploadThumbnailFile(file));
    } finally {
      input.value = "";
    }
  };

  const handleThumbnailLoad = () => setIsThumbnailLoading(false);
  const handleThumbnailError = () => {
    setIsThumbnailLoading(false);
    setThumbnailUrl("");
  };

  return {
    projectName, setProjectName,
    projectDescription, setProjectDescription,
    mainFeatures, setMainFeatures,
    techStack,
    selectedSkills,
    deployUrl, setDeployUrl,
    thumbnailUrl, setThumbnailUrl,
    isThumbnailLoading,
    thumbnailError,
    isLoadingRepoData,
    isAIWriting,
    aiError,
    thumbnailInputRef,
    handleSkillsChange,
    handleLoadInfo,
    handleGenerateThumbnail,
    handleThumbnailFileChange,
    handleThumbnailLoad,
    handleThumbnailError,
  };
}
