"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

/**
 * /board 트리 전체(목록·상세·작성·수정)의 에러 경계.
 * 예전엔 board에 error.tsx가 없어서 상세 페이지 렌더가 실패하면
 * Next.js 기본 500 화면으로 떨어졌다.
 */
export default function BoardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("board.error");

  useEffect(() => {
    console.error("[board] 렌더링 실패:", error);
  }, [error]);

  return (
    <main className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-4 px-6 py-8">
      <p className="text-lg font-semibold text-gray-800">{t("title")}</p>
      <p className="text-sm text-gray-500">{t("desc")}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
      >
        {t("retry")}
      </button>
    </main>
  );
}
