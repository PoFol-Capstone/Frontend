"use client";

import { useTranslations } from "next-intl";
import type { SentenceSource } from "@/types/resume";

const SOURCE_STYLE: Record<SentenceSource, string> = {
  VERIFIED: "bg-green-50 text-green-700",
  SELF: "bg-gray-100 text-gray-600",
  AI: "bg-violet-50 text-violet-700",
};

/** 출처 배지 — 검증됨 / 본인 작성 / AI 작성 (이력서 · 프로젝트 정리 카드 공통). 인쇄에는 검증됨만 남긴다 */
export function SourceBadge({ source }: { source: SentenceSource }) {
  const t = useTranslations("resume.editor.source");
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${SOURCE_STYLE[source]} ${source === "VERIFIED" ? "" : "print:hidden"}`}>
      {t(source)}
    </span>
  );
}
