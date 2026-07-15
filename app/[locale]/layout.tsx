import Header from "@/components/Header";
import { NavigationProvider } from "@/components/NavigationProvider";
import type { Metadata } from "next";
import "../globals.css";
import { getSession } from "@/lib/session";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "PoFol",
  description: "개발자 팀 매칭 & 포트폴리오 플랫폼",
  icons: {
    icon: "/icons/icon.png",
    apple: "/icons/apple-icon.png",
  },
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

  const session = await getSession();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <NavigationProvider>
            <Header session={session} />
            {children}
          </NavigationProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
