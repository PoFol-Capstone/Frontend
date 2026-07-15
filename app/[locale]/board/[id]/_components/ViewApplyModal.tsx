"use client";

import { cancelApply } from "@/lib/apply";
import type { ResponseApplication } from "@/types/post";
import { useTranslations } from "next-intl";
import Modal from "./Modal";

type Props = {
  postUuid: string;
  application: ResponseApplication;
  onClose: () => void;
  onEdit: () => void;
  onCancel: () => void;
};

export default function ViewApplyModal({
  postUuid,
  application,
  onClose,
  onEdit,
  onCancel,
}: Props) {
  const t = useTranslations("board.apply");
  const isPending = application.status === "PENDING";

  const handleCancel = async () => {
    await cancelApply(postUuid);
    onCancel();
  };

  return (
    <Modal title={t("viewModalTitle")} onClose={onClose}>
      <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
        <p className="font-semibold">{t("sectionCompleteTitle")}</p>
        <p className="mt-1">
          {isPending
            ? t("editableUntilDeadline")
            : t("notEditable")}
        </p>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-sm font-medium">{t("appliedPosition")}</p>
        <span className="rounded-full border border-black px-3 py-1 text-xs">
          {application.positionType}
        </span>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-sm font-medium">{t("introduction")}</p>
        <div className="min-h-24 rounded-xl border border-gray-200 p-3 text-sm text-gray-700">
          {application.introduction || t("noContent")}
        </div>
      </div>

      <div className="mb-5">
        <p className="mb-2 text-sm font-medium">{t("portfolio")}</p>
        <div className="rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-500">
          {application.portfolioUrl || t("noContent")}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-gray-200 py-3 text-sm"
        >
          {t("close")}
        </button>
        {isPending && (
          <>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 rounded-xl border border-red-200 py-3 text-sm text-red-500"
            >
              {t("cancelApplication")}
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="flex-1 rounded-xl bg-black py-3 text-sm font-semibold text-white"
            >
              {t("edit")}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
