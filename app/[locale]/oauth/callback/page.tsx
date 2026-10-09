import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

/**
 * 백엔드 GitHub "로그인" 플로우의 도착지.
 *
 * 백엔드는 state 없이 accessToken/refreshToken/uuid를 쿼리로 실어 이 주소로 보낸다.
 * 예전엔 그 값을 그대로 세션으로 저장해서, 공격자가 자기 토큰이 든 링크를 열게 하면
 * 피해자의 로그인 계정이 바뀌었다(기존 session 이메일은 남아 신원도 어긋났다).
 * 브라우저에 묶인 state·일회성 코드 교환 계약이 생기기 전까지 이 경로로는 로그인하지 않는다.
 * proxy.ts가 쿼리를 지운 주소로 먼저 리다이렉트하고, 이 페이지는 쿠키를 건드리지 않는다.
 *
 * GitHub "계정 연동"(로그인한 사용자가 /api/auth/github/connect로 시작하는 state 기반 흐름)은
 * 백엔드가 /board/write?github_connected=true로 돌려보내므로 이 페이지와 무관하다.
 */
export default async function OAuthCallbackPage() {
  const t = await getTranslations("auth.oauth");

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6">
      <section className="max-w-md text-center" role="status">
        <h1 className="text-lg font-semibold text-gray-900">
          {t("unsupportedTitle")}
        </h1>
        <p className="mt-2 text-sm text-gray-500">{t("unsupportedDesc")}</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
        >
          {t("goToLogin")}
        </Link>
      </section>
    </main>
  );
}
