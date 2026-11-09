import HeaderSlot, { HeaderFallback } from "@/components/HeaderSlot";
import { NavigationProvider } from "@/components/NavigationProvider";
import type { Metadata } from "next";
import "../globals.css";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Pofol",
  description: "개발자 팀 매칭 & 포트폴리오 플랫폼",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <head>
        {/* 동적 서브셋: 페이지에 쓰인 글자 묶음만 받는다 (전체 woff2는 2MB) */}
        <link
          rel="stylesheet"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <NextIntlClientProvider>
          <NavigationProvider>
            {/* 세션 쿠키 읽기는 HeaderSlot 안으로 옮겨 Suspense 뒤에서 스트리밍한다.
                레이아웃이 직접 쿠키를 읽으면 모든 페이지의 static shell이 막힌다. */}
            <Suspense fallback={<HeaderFallback />}>
              <HeaderSlot />
            </Suspense>
            {children}
          </NavigationProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
