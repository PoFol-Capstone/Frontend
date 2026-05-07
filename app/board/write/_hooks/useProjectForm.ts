"use client";
import { useRef, useState } from "react";
import type { Skill } from "@/types/skill";

export function useProjectForm() {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [mainFeatures, setMainFeatures] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [deployUrl, setDeployUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isThumbnailLoading, setIsThumbnailLoading] = useState(false);
  const [isLoadingRepoData, setIsLoadingRepoData] = useState(false);
  const [isAIWriting, setIsAIWriting] = useState(false);
  const [aiError, setAiError] = useState("");

  const thumbnailInputRef = useRef<HTMLInputElement>(null);

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
      setThumbnailUrl("");

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
        if (!aiRes.ok) throw new Error(aiData.error ?? "AI 요약에 실패했습니다.");
        setProjectDescription(aiData.projectDescription ?? "");
        setMainFeatures(aiData.mainFeatures ?? "");
        setIsAIWriting(false);

        setIsThumbnailLoading(true);
        const thumbRes = await fetch("/api/ai/thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectName: name,
            techStack: stack,
            projectDescription: aiData.projectDescription ?? "",
            mainFeatures: aiData.mainFeatures ?? "",
          }),
        });
        const thumbData = await thumbRes.json();
        if (!thumbRes.ok) throw new Error(thumbData.error ?? "썸네일 생성에 실패했습니다.");
        setThumbnailUrl(thumbData.url ?? "");
        setIsThumbnailLoading(false);
      }
    } catch (err) {
      setIsLoadingRepoData(false);
      setIsAIWriting(false);
      setIsThumbnailLoading(false);
      if (err instanceof Error) setAiError(err.message);
    }
  };

  const handleGenerateThumbnail = async () => {
    if (!projectName) return;
    setIsThumbnailLoading(true);
    setThumbnailUrl("");
    try {
      const res = await fetch("/api/ai/thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName, techStack, projectDescription, mainFeatures }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setThumbnailUrl(data.url ?? "");
    } catch { /* ignore */ }
    finally { setIsThumbnailLoading(false); }
  };

  const handleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsThumbnailLoading(true);
    setThumbnailUrl("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload/thumbnail", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setThumbnailUrl(data.url ?? "");
    } catch { /* ignore */ }
    finally {
      setIsThumbnailLoading(false);
      e.target.value = "";
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
    thumbnailUrl,
    isThumbnailLoading,
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
