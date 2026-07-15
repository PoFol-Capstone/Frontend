"use client";

import { useNavigation } from "@/components/NavigationProvider";
import { logout } from "@/lib/session";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function ProfileMenu() {
  const t = useTranslations("profileMenu");
  const { handleLinkClick, startNavigation } = useNavigation();

  const MENU_ITEMS = [
    { label: t("profile"), href: "/profile" },
    { label: t("recruitment"), href: "/recruitment" },
    { label: t("settings"), href: "/settings" },
  ];

  return (
    <div className="absolute right-0 top-9 z-50 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
      {MENU_ITEMS.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          onClick={(e) => handleLinkClick(e, href)}
          className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-gray-50"
        >
          <span>{label}</span>
        </Link>
      ))}

      <div className="border-t border-gray-100">
        <button
          type="button"
          onClick={() => startNavigation(() => logout())}
          className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-500 transition-colors hover:bg-red-50"
        >
          <span>{t("logout")}</span>
        </button>
      </div>
    </div>
  );
}
