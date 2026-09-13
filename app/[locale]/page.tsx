import { Suspense } from "react";
import BrandLogo from "@/components/BrandLogo";
import { getSession } from "@/lib/session";
import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import Reveal from "./_components/Reveal";

/**
 * 로그인 상태면 /board로 보내는 랜딩 페이지.
 * 쿠키를 읽어야 하므로(런타임 API) Suspense 뒤에서 처리한다.
 */
export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <HomeContent />
    </Suspense>
  );
}

const FEATURE_ACCENTS = [
  { icon: "bg-black", text: "text-gray-500", ring: "hover:border-gray-300" },
  {
    icon: "bg-stone-700",
    text: "text-stone-500",
    ring: "hover:border-stone-300",
  },
  {
    icon: "bg-slate-700",
    text: "text-slate-500",
    ring: "hover:border-slate-300",
  },
];

async function HomeContent() {
  const session = await getSession();
  if (session) redirect({ href: "/board", locale: await getLocale() });

  const t = await getTranslations("home");

  return (
    <main className="min-h-screen bg-white text-black">
      {/* 히어로 */}
      <section className="relative flex flex-col items-center justify-center gap-6 overflow-hidden px-6 py-20 text-center sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="animate-blob absolute -top-24 left-1/2 h-72 w-72 -translate-x-[80%] rounded-full bg-indigo-100/70 blur-3xl" />
          <div className="animate-blob delay-200 absolute -top-16 left-1/2 h-72 w-72 translate-x-[10%] rounded-full bg-rose-100/70 blur-3xl" />
          <div className="animate-blob delay-300 absolute top-24 left-1/2 h-64 w-64 translate-x-[70%] rounded-full bg-amber-100/60 blur-3xl" />
        </div>

        <BrandLogo
          variant="full"
          className="animate-logo mb-2 drop-shadow-[0_18px_30px_rgba(0,0,0,0.12)]"
        />
        <h2 className="animate-fade-in-up delay-100 text-3xl font-bold text-balance">
          {t("hero.title")}
        </h2>
        <p className="animate-fade-in-up delay-200 text-gray-600">
          {t("hero.subtitle")}
        </p>

        <div className="animate-fade-in-up delay-300 flex gap-4">
          <Link
            href="/signup"
            className="group relative overflow-hidden rounded-lg border bg-black px-6 py-3 text-sm text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
          >
            <span
              aria-hidden
              className="animate-shine absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
            />
            <span className="relative">{t("hero.getStarted")}</span>
          </Link>

          <Link
            href="/login"
            className="rounded-lg border bg-white px-6 py-3 text-sm text-black transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-400 hover:shadow-md"
          >
            {t("hero.login")}
          </Link>
        </div>
      </section>

      {/* 기능 소개 */}
      <section className="border-t border-gray-200 bg-gray-50/60 py-20 sm:py-28">
        <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6">
          {[
            {
              step: t("codeReview.step"),
              title: t("codeReview.title"),
              description: t.rich("codeReview.description", {
                br: () => <br />,
              }),
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              ),
            },
            {
              step: t("recruitment.step"),
              title: t("recruitment.title"),
              description: t.rich("recruitment.description", {
                br: () => <br />,
              }),
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a4 4 0 00-5-3.874M9 20H4v-2a4 4 0 015-3.874M15 7a4 4 0 11-8 0 4 4 0 018 0zm6 4a3 3 0 11-6 0 3 3 0 016 0zM3 11a3 3 0 116 0 3 3 0 01-6 0z"
                />
              ),
            },
            {
              step: t("portfolio.step"),
              title: t("portfolio.title"),
              description: t.rich("portfolio.description", {
                br: () => <br />,
              }),
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              ),
            },
          ].map((feature, i) => {
            const accent = FEATURE_ACCENTS[i];
            return (
              <Reveal key={feature.step} delay={i * 100}>
                <div
                  className={`group flex items-start gap-6 rounded-3xl border border-transparent bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${accent.ring}`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent.icon} mt-1 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}
                  >
                    <svg
                      className="h-5 w-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      {feature.icon}
                    </svg>
                  </div>
                  <div>
                    <p
                      className={`mb-2 text-xs font-semibold tracking-widest uppercase ${accent.text}`}
                    >
                      {feature.step}
                    </p>
                    <p className="mb-3 text-xl font-bold">{feature.title}</p>
                    <p className="leading-relaxed text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <Reveal className="border-t border-gray-200 px-6 py-24">
        <div className="relative mx-auto max-w-2xl overflow-hidden rounded-3xl bg-gradient-to-br from-black to-neutral-800 py-16 text-center text-white">
          <div
            aria-hidden
            className="animate-blob absolute -right-10 -bottom-16 h-56 w-56 rounded-full bg-white/10 blur-3xl"
          />
          <p className="relative mb-6 text-xl font-semibold">
            {t("cta.title")}
          </p>
          <Link
            href="/signup"
            className="relative inline-block rounded-lg bg-white px-6 py-3 text-sm font-medium text-black transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/20"
          >
            {t("cta.button")}
          </Link>
        </div>
      </Reveal>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 py-10 text-center text-sm text-gray-500">
        {t("footer")}
      </footer>
    </main>
  );
}
