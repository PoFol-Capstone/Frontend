import Header from "@/components/Header";
import type { Metadata } from "next";
import "./globals.css";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "PoFol",
  description: "개발자 팀 매칭 & 포트폴리오 플랫폼",
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
        <Header session={session} />
        {children}
      </body>
    </html>
  );
}