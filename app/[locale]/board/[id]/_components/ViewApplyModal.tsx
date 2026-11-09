"use client";

import { cancelApply } from "@/lib/apply";
import type { ResponseApplication } from "@/types/post";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Modal from "@/components/Modal";

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
  const [isCanceling, setIsCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    setError(null);
    setIsCanceling(true);
    try {
      await cancelApply(postUuid);
      onCancel();
    } catch (err) {
      // 예전엔 실패해도 예외가 그대로 튀어나가 모달이 멈춘 것처럼 보였다
      console.error("[apply] 지원 취소 실패:", err);
      setError(t("cancelFailed"));
      setIsCanceling(false);
    }
  };

  return (
    <Modal title={t("viewModalTitle")} onClose={onClose}>
      <div className="space-y-6">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
          <p className="font-semibold">{t("sectionCompleteTitle")}</p>
          <p className="mt-1">
            {isPending
              ? t("editableUntilDeadline")
              : t("notEditable")}
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-gray-900">{t("appliedPosition")}</p>
          <span className="rounded-full border border-black px-3 py-1 text-xs">
            {application.positionType}
          </span>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-gray-900">{t("introduction")}</p>
          <div className="min-h-28 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] leading-relaxed text-gray-700">
            {application.introduction || t("noContent")}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-gray-900">{t("portfolio")}</p>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] text-gray-500">
            {application.portfolioUrl || t("noContent")}
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isCanceling}
            className="btn btn-secondary flex-1"
          >
            {t("close")}
          </button>
          {isPending && (
            <>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isCanceling}
                className="btn flex-1 border border-red-200 text-red-500 hover:bg-red-50"
              >
                {isCanceling ? t("canceling") : t("cancelApplication")}
              </button>
              <button
                type="button"
                onClick={onEdit}
                disabled={isCanceling}
                className="btn btn-primary flex-1"
              >
                {t("edit")}
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
