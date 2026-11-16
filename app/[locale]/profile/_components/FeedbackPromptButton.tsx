"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";

/** 탭 내용을 외부 AI(GPT · Claude)에 붙여넣을 프롬프트로 복사한다 — AI 호출 없음 */
export default function FeedbackPromptButton({ buildPrompt }: { buildPrompt: () => string }) {
  const t = useTranslations("profile.projects.feedbackPrompt");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const prompt = buildPrompt();
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t("manualCopy"), prompt);
    }
  };

  return (
    <button type="button" onClick={copy} title={t("hint")}
      className="btn btn-secondary btn-sm">
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      {copied ? t("copied") : t("copy")}
    </button>
  );
}
