"use client";

import { submitApply } from "@/lib/apply";
import type { RecruitPositionResponse, ResponseApplication } from "@/types/post";
import { useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/Modal";
import Field from "@/components/ui/Field";
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
      <div className="space-y-6">
        <PositionSelector
          positions={positions}
          selectedPosition={selectedPosition}
          onSelect={(position) => {
            setSelectedPosition(position);
            setError(null);
          }}
        />

        <Field label={t("introduction")}>
          <textarea
            placeholder={t("introductionPlaceholder")}
            value={introduction}
            onChange={(e) => setIntroduction(e.target.value)}
            className="input resize-none"
          />
        </Field>

        <Field label={t("portfolio")}>
          <input
            placeholder={t("portfolioPlaceholder")}
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            className="input"
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn btn-secondary flex-1"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn btn-primary flex-1"
          >
            {isSubmitting ? t("submitting") : t("submit")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
