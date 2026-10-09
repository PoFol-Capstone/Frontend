"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getPathname } from "@/i18n/navigation";
import { clearSession } from "@/lib/session";

/**
 * 서버 렌더 중 세션이 무효로 확인됐을 때(삭제된 사용자, 거절된 토큰) 보여주는 화면.
 *
 * Server Component는 쿠키를 지울 수 없고, 쿠키가 남아 있으면 proxy가 /login 접근을 /board로
 * 돌려보내 오류 화면과 게시판 사이에 갇힌다. 그래서 쿠키 삭제는 Server Function(clearSession)
 * 경계에서 하고, 끝나면 원래 페이지를 callbackUrl로 실어 로그인 화면으로 보낸다.
 *
 * @param returnTo 로그인 후 돌아올 경로 (locale 접두사 없이, 예: "/profile")
 */
export default function SessionExpired({ returnTo }: { returnTo: string }) {
  const t = useTranslations("session");
  const locale = useLocale();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const callbackUrl = getPathname({ href: returnTo, locale });
    const loginHref = getPathname({
      href: { pathname: "/login", query: { callbackUrl } },
      locale,
    });

    clearSession().then(
      () => {
        if (!cancelled) window.location.replace(loginHref);
      },
      (error) => {
        console.error("[session] 세션 정리 실패:", error);
        if (!cancelled) setFailed(true);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [returnTo, locale, attempt]);

  return (
    <main className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-4 px-6 py-8">
      <div role="status" aria-live="polite" className="text-center">
        <p className="text-lg font-semibold text-gray-800">{t("expiredTitle")}</p>
        <p className="mt-2 text-sm text-gray-500">
          {failed ? t("clearFailed") : t("redirecting")}
        </p>
      </div>
      {failed && (
        <button
          type="button"
          onClick={() => {
            setFailed(false);
            setAttempt((n) => n + 1);
          }}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          {t("retry")}
        </button>
      )}
    </main>
  );
}
