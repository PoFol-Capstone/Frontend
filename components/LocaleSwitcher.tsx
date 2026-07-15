"use client";

import { useRef, useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Globe } from "lucide-react";

const LOCALE_LABELS: Record<(typeof routing.locales)[number], string> = {
  ko: "한국어",
  en: "English",
};

export default function LocaleSwitcher() {
  const t = useTranslations("localeSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (ref.current && !ref.current.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (nextLocale: (typeof routing.locales)[number]) => {
    setIsOpen(false);
    if (nextLocale === locale) return;
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-center text-gray-600 transition hover:text-black"
        aria-label={t("label")}
      >
        <Globe className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-9 z-50 w-36 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {routing.locales.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => handleSelect(code)}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                code === locale ? "font-semibold text-black" : "text-gray-600"
              }`}
            >
              <span>{LOCALE_LABELS[code]}</span>
              {code === locale && <span className="text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
