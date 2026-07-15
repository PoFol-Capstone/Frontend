import { useTranslations } from "next-intl";

type Props = {
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
};

export default function DeleteModal({ onClose, onConfirm, isDeleting }: Props) {
  const t = useTranslations("board.detail");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-base font-semibold">{t("deleteConfirmTitle")}</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          {t("deleteConfirmDesc")}
        </p>
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
