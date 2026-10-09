"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

/**
 * 모집 관리 오류 경계. 예전엔 지원자 조회 실패를 빈 배열로 흡수해 "아직 지원자가 없어요"로
 * 보였다. 이제 실패를 여기서 보여주고, unstable_retry로 서버 데이터를 다시 받아 복구한다
 * (reset은 다시 가져오지 않고 같은 결과를 다시 그릴 뿐이다).
 */
export default function RecruitmentError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const t = useTranslations("common.loadError");
  const tCommon = useTranslations("common");

  useEffect(() => {
    console.error("[recruitment] 렌더링 실패:", error);
  }, [error]);

  return (
    <main className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-4 px-6 py-8">
      <p role="alert" className="text-lg font-semibold text-gray-800">
        {t("title")}
      </p>
      <p className="text-sm text-gray-500">{t("desc")}</p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
      >
        {tCommon("retry")}
      </button>
    </main>
  );
}
