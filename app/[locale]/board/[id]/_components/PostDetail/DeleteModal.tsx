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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id={titleId} className="text-base font-semibold">
          {t("deleteConfirmTitle")}
        </h2>
        <p id={descId} className="mt-1.5 text-sm text-gray-500">
          {t("deleteConfirmDesc")}
        </p>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-500">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
          >
            {isDeleting ? t("deleting") : t("delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
