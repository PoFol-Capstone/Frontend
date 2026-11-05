"use client";

import { useModalA11y } from "@/hooks/useModalA11y";
import { useTranslations } from "next-intl";
import { useId } from "react";

type Props = {
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  error?: string | null;
};

export default function DeleteModal({
  onClose,
  onConfirm,
  isDeleting,
  error,
}: Props) {
  const t = useTranslations("board.detail");
  const panelRef = useModalA11y(onClose);
  const titleId = useId();
  const descId = useId();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className="mx-4 w-full max-w-sm rounded-3xl bg-white p-6 shadow-lg sm:p-8"
      >
        <h2 id={titleId} className="text-xl font-bold tracking-tight">
          {t("deleteConfirmTitle")}
        </h2>
        <p id={descId} className="mt-2 text-[15px] leading-relaxed text-gray-500">
          {t("deleteConfirmDesc")}
        </p>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-500">
            {error}
          </p>
        )}

        <div className="mt-8 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="btn btn-secondary flex-1"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="btn flex-1 bg-red-500 text-white hover:bg-red-600"
          >
            {isDeleting ? t("deleting") : t("delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
