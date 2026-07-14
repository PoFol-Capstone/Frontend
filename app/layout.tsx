import Header from "@/components/Header";
import { NavigationProvider } from "@/components/NavigationProvider";
import type { Metadata } from "next";
import "./globals.css";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "PoFol",
  description: "개발자 팀 매칭 & 포트폴리오 플랫폼",
  icons: {
    icon: "/icons/icon.png",
    apple: "/icons/apple-icon.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="ko">
      <body>
        <NavigationProvider>
          <Header session={session} />
          {children}
        </NavigationProvider>
      </body>
    </html>
  );
}