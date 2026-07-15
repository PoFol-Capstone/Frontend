import { getSession } from "@/lib/session";
import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect({ href: "/board", locale: await getLocale() });

  const t = await getTranslations("home");

  return (
    <main className="min-h-screen bg-white text-black">
      {/* 히어로 */}
      <section className="flex flex-col items-center justify-center text-center py-32 gap-6">
        <h2 className="text-3xl font-bold">{t("hero.title")}</h2>
        <p className="text-gray-600">{t("hero.subtitle")}</p>

        <div className="flex gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-black border px-6 py-3 text-sm text-white"
          >
            {t("hero.getStarted")}
          </Link>

          <Link
            href="/login"
            className="border rounded-lg bg-white px-6 py-3 text-sm text-black"
          >
            {t("hero.login")}
          </Link>
        </div>
      </section>

      {/* 기능 소개 */}
      <section className="border-t border-gray-200">
        {/* 코드 리뷰 */}
        <div className="bg-gray-50 py-20">
          <div className="max-w-2xl mx-auto px-6 flex gap-6 items-start">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-black flex items-center justify-center mt-1">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-2">{t("codeReview.step")}</p>
              <p className="text-xl font-bold mb-3">{t("codeReview.title")}</p>
              <p className="text-gray-600 leading-relaxed">
                {t.rich("codeReview.description", { br: () => <br /> })}
              </p>
            </div>
          </div>
        </div>

        {/* 팀원 모집 */}
        <div className="bg-stone-50 py-20">
          <div className="max-w-2xl mx-auto px-6 flex gap-6 items-start">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-stone-700 flex items-center justify-center mt-1">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.874M9 20H4v-2a4 4 0 015-3.874M15 7a4 4 0 11-8 0 4 4 0 018 0zm6 4a3 3 0 11-6 0 3 3 0 016 0zM3 11a3 3 0 116 0 3 3 0 01-6 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-stone-500 uppercase mb-2">{t("recruitment.step")}</p>
              <p className="text-xl font-bold mb-3">{t("recruitment.title")}</p>
              <p className="text-gray-600 leading-relaxed">
                {t.rich("recruitment.description", { br: () => <br /> })}
              </p>
            </div>
          </div>
        </div>

        {/* 포트폴리오 */}
        <div className="bg-slate-50 py-20">
          <div className="max-w-2xl mx-auto px-6 flex gap-6 items-start">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-700 flex items-center justify-center mt-1">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-2">{t("portfolio.step")}</p>
              <p className="text-xl font-bold mb-3">{t("portfolio.title")}</p>
              <p className="text-gray-600 leading-relaxed">
                {t.rich("portfolio.description", { br: () => <br /> })}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-24 border-t border-gray-200">
        <p className="text-xl font-semibold mb-4">{t("cta.title")}</p>
        <Link
          href="/signup"
          className="border rounded-lg bg-white px-6 py-3 text-sm text-black"
        >
          {t("cta.button")}
        </Link>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 py-10 text-center text-sm text-gray-500">
        {t("footer")}
      </footer>
    </main>
  );
}
