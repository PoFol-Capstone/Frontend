"use client";

import { updateApply } from "@/lib/apply";
import type { ResponseApplication } from "@/types/post";
import { useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "./Modal";

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
      <div className="mb-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
        {t("editHint")}
      </div>

      <label className="mb-4 block">
        <span className="mb-2 block text-sm font-medium">{t("introduction")}</span>
        <textarea
          value={introduction}
          onChange={(e) => setIntroduction(e.target.value)}
          className="h-28 w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-black"
        />
      </label>

      <label className="mb-5 block">
        <span className="mb-2 block text-sm font-medium">
          {t("portfolio")}
        </span>
        <input
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
          disabled={isSaving}
          className="flex-1 rounded-xl border border-gray-200 py-3 text-sm disabled:opacity-50"
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 rounded-xl bg-black py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSaving ? t("saving") : t("save")}
        </button>
      </div>
    </Modal>
  );
}
