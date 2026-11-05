"use client";

import { useModalA11y } from "@/hooks/useModalA11y";
import { useTranslations } from "next-intl";
import { useId } from "react";

export default function Modal({
  title,
  children,
  onClose,
  className = "max-w-md",
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  /** 패널 폭·레이아웃 (기본 max-w-md) */
  className?: string;
}) {
  const t = useTranslations("common");
  const panelRef = useModalA11y(onClose);
  const titleId = useId();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white p-6 shadow-lg sm:p-8 ${className}`}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 id={titleId} className="text-xl font-bold tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="text-xl text-gray-400 hover:text-black"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
