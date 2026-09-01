"use client";

import { submitApply } from "@/lib/apply";
import type { RecruitPositionResponse, ResponseApplication } from "@/types/post";
import { useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "./Modal";
import PositionSelector from "./PositionSelector";

type Props = {
  postUuid: string;
  positions: RecruitPositionResponse[];
  onSuccess: (application: ResponseApplication) => void;
  onClose: () => void;
};

export default function ApplyModal({
  postUuid,
  positions,
  onSuccess,
  onClose,
}: Props) {
  const t = useTranslations("board.apply");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // 예전엔 검증이 전혀 없어서 포지션을 안 고르면 백엔드 400이 조용히 삼켜졌다
    if (!selectedPosition) {
      setError(t("positionRequired"));
      return;
    }
    if (!introduction.trim()) {
      setError(t("introductionRequired"));
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const updated = await submitApply(postUuid, {
        positionType: selectedPosition,
        introduction: introduction.trim(),
        portfolioUrl: portfolioUrl.trim(),
      });
      onSuccess(updated);
      onClose();
    } catch (err) {
      console.error("[apply] 지원 실패:", err);
      setError(t("submitFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title={t("modalTitle")} onClose={onClose}>
      <PositionSelector
        positions={positions}
        selectedPosition={selectedPosition}
        onSelect={(position) => {
          setSelectedPosition(position);
          setError(null);
        }}
      />

      <label className="mb-4 block">
        <span className="mb-2 block text-sm font-medium">
          {t("introduction")}
        </span>
        <textarea
          placeholder={t("introductionPlaceholder")}
          value={introduction}
          onChange={(e) => setIntroduction(e.target.value)}
          className="h-28 w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-black"
        />
      </label>

      <label className="mb-5 block">
        <span className="mb-2 block text-sm font-medium">{t("portfolio")}</span>
        <input
          placeholder={t("portfolioPlaceholder")}
          value={portfolioUrl}
          onChange={(e) => setPortfolioUrl(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-black"
        />
      </label>

      {error && (
        <p role="alert" className="mb-4 text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="flex-1 rounded-xl border border-gray-200 py-3 text-sm disabled:opacity-50"
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 rounded-xl bg-black py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSubmitting ? t("submitting") : t("submit")}
        </button>
      </div>
    </Modal>
  );
}
