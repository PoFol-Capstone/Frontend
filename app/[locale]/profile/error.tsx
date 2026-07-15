"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("profile.error");

  useEffect(() => {
    console.error("[profile] 렌더링 실패:", error);
  }, [error]);

  return (
    <main className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-4 px-10 py-8">
      <p className="text-lg font-semibold text-gray-800">
        {t("title")}
      </p>
      <p className="text-sm text-gray-500">
        {t("desc")}
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
      >
        {t("retry")}
      </button>
    </main>
  );
}
