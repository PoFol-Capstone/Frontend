"use client";

import Modal from "@/components/Modal";
import { useTranslations } from "next-intl";

interface Props {
  title: string;
  description: string;
  confirmLabel: string;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** 되돌리기 어려운 처리(거절·모집 마감) 전에 한 번 더 묻는다 */
export default function ConfirmDialog({
  title,
  description,
  confirmLabel,
  isPending,
  onConfirm,
  onClose,
}: Props) {
  const t = useTranslations("recruitment.confirm");

  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm leading-6 text-gray-600">{description}</p>
      <div className="mt-6 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? t("processing") : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
