"use client";

import { useNavigation } from "@/components/NavigationProvider";
import { Link, usePathname } from "@/i18n/navigation";
import { LayoutGrid, Settings, TrendingUp } from "lucide-react";
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
    { href: "/settings", label: tMenu("settings"), Icon: Settings },
  ];

  return (
    <nav
      id="mobile-tab-bar"
      aria-label={tHeader("mainNav")}
      className="fixed inset-x-4 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-sm rounded-full border border-gray-200/80 bg-white/80 p-1.5 shadow-lg shadow-black/10 backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-3 gap-1">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={(e) => handleLinkClick(e, href)}
                aria-current={active ? "page" : undefined}
                className={`flex h-12 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-medium transition ${
                  active ? "bg-black text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
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
