"use client";

import { ArrowUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/** 어느 정도 내려가면 나타나는 맨 위로 버튼 — 모바일은 하단 탭바 위에 띄운다 */
export default function ScrollTopButton() {
  const t = useTranslations("profile");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;
  return (
    <button
      type="button"
      aria-label={t("scrollTop")}
      title={t("scrollTop")}
      onClick={() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }}
      className="fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md transition hover:text-black md:bottom-8 md:right-8"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
