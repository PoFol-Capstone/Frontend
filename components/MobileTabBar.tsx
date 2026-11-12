"use client";

import { useNavigation } from "@/components/NavigationProvider";
import { Link, usePathname } from "@/i18n/navigation";
import { Bookmark, LayoutGrid, Settings, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

/** 로그인 상태의 모바일(md 미만) 하단 탭바 — 데스크톱은 헤더 메뉴를 쓴다 */
export default function MobileTabBar() {
  const tHeader = useTranslations("header");
  const tMenu = useTranslations("profileMenu");
  const pathname = usePathname();
  const { handleLinkClick } = useNavigation();

  const tabs = [
    { href: "/profile", label: tHeader("myProjects"), Icon: LayoutGrid },
    { href: "/trends", label: tHeader("trends"), Icon: TrendingUp },
    { href: "/bookmark", label: tMenu("bookmark"), Icon: Bookmark },
    { href: "/settings", label: tMenu("settings"), Icon: Settings },
  ];

  return (
    <nav
      id="mobile-tab-bar"
      aria-label={tHeader("mainNav")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-4">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={(e) => handleLinkClick(e, href)}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
                  active ? "text-black" : "text-gray-400 hover:text-gray-700"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
