"use client";

import { updateApply } from "@/lib/apply";
import type { ResponseApplication } from "@/types/post";
import { useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/Modal";
import Field from "@/components/ui/Field";

type Props = {
  postUuid: string;
  application: ResponseApplication;
  onClose: () => void;
};

export default function EditApplyModal({ postUuid, application, onClose }: Props) {
  const t = useTranslations("board.apply");
  const [introduction, setIntroduction] = useState(application.introduction);
  const [portfolioUrl, setPortfolioUrl] = useState(application.portfolioUrl ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!introduction.trim()) {
      setError(t("introductionRequired"));
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await updateApply(postUuid, {
        introduction: introduction.trim(),
        portfolioUrl: portfolioUrl.trim(),
      });
      sessionStorage.setItem("toastMessage", t("savedToast"));
      onClose();
      window.location.reload();
    } catch (err) {
      // 예전엔 console.error만 찍고 모달이 그대로 열려 있어서
      // 사용자는 저장이 됐는지 안 됐는지 알 수 없었다
      console.error("[apply] 지원서 수정 실패:", err);
      setError(t("saveFailed"));
      setIsSaving(false);
    }
    // 성공 시엔 페이지를 새로고침하므로 setIsSaving(false)를 하지 않는다 (버튼이 계속 비활성)
  };

  return (
    <Modal title={t("editModalTitle")} onClose={onClose}>
      <div className="space-y-6">
        <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
          {t("editHint")}
        </div>

        <Field label={t("introduction")}>
          <textarea
            value={introduction}
            onChange={(e) => setIntroduction(e.target.value)}
            className="input resize-none"
          />
        </Field>

        <Field label={t("portfolio")}>
          <input
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
            disabled={isSaving}
            className="btn btn-secondary flex-1"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary flex-1"
          >
            {isSaving ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
