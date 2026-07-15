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

  const handleSave = async () => {
    try {
      await updateApply(postUuid, { introduction, portfolioUrl });
      sessionStorage.setItem("toastMessage", t("savedToast"));
      onClose();
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
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

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-gray-200 py-3 text-sm"
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 rounded-xl bg-black py-3 text-sm font-semibold text-white"
        >
          {t("save")}
        </button>
      </div>
    </Modal>
  );
}
