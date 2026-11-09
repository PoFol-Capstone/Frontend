"use client";

import BrandLogo from "@/components/BrandLogo";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { useNavigation } from "@/components/NavigationProvider";
import NotificationDrawer from "@/components/NotificationDrawer";
import ProfileMenu from "@/components/ProfileMenu";
import { useNotifications } from "@/hooks/useNotifications";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Bell, Search, User } from "lucide-react";

export default function Header({ session }: { session: string | null }) {
  const t = useTranslations("header");
  const isLoggedIn = !!session;

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const { handleLinkClick } = useNavigation();
  const [keyword, setKeyword] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = keyword.trim();
    if (!trimmed) return;

    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  // 게시판으로 돌아오면 검색어를 비운다. effect 안에서 setState하면 렌더가 한 번 더 돌기 때문에
  // (react-hooks/set-state-in-effect) 경로가 바뀐 렌더에서 바로 상태를 맞춘다 — BoardClient 등과 같은 패턴.
  const [keywordPathname, setKeywordPathname] = useState(pathname);
  if (pathname !== keywordPathname) {
    setKeywordPathname(pathname);
    if (pathname === "/board") setKeyword("");
  }

  const {
    unreadCount,
    notifications,
    hasMore,
    isLoading,
    loadError,
    refresh: refreshNotifications,
    loadMore,
    retry: retryNotifications,
    markOneRead,
    markAllRead,
  } = useNotifications(isLoggedIn);

  const profileRef = useRef<HTMLDivElement>(null);

  // 열 때마다 최신 목록을 다시 받는다 — 예전엔 처음 한 번만 불러서, 이후 도착한 알림은
  // 배지에만 보이고 목록에는 나타나지 않았다
  const handleOpenNotifications = () => {
    setIsNotificationOpen(true);
    setIsProfileOpen(false);
    refreshNotifications();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-10">
      <div className="mx-auto flex min-h-9 flex-wrap items-center justify-between gap-x-3 gap-y-3">
        <div className="flex min-w-0 shrink-0 items-end">
          <Link
            href={isLoggedIn ? "/profile" : "/"}
            onClick={(e) => handleLinkClick(e, isLoggedIn ? "/profile" : "/")}
            className="inline-flex shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            <BrandLogo />
          </Link>
          {isLoggedIn && (
            // 게시판(탐방)은 메인 메뉴에서 뺐다 — 페이지 · 데이터는 유지 (docs/2026-11-06-pivot-summary.md 5장)
            <nav
              aria-label={t("mainNav")}
              className="ml-4 flex items-center gap-3 text-sm font-medium sm:ml-6 sm:gap-5"
            >
              {[
                {
                  href: "/profile",
                  label: t("myProjects"),
                  active: pathname === "/profile",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleLinkClick(e, item.href)}
                  aria-current={item.active ? "page" : undefined}
                  className={
                    item.active
                      ? "text-black"
                      : "text-gray-400 hover:text-gray-700"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {isLoggedIn ? (
          <>
            <div className="order-last flex w-full justify-center sm:order-none sm:w-auto sm:min-w-0 sm:flex-1 sm:px-4 lg:px-10">
              <form
                onSubmit={handleSearch}
                className="relative w-full max-w-md"
              >
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="input h-10 pl-10"
                />
              </form>
            </div>

            <div className="flex shrink-0 items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={handleOpenNotifications}
                className="relative flex items-center justify-center text-gray-600 transition hover:text-black"
                aria-label={t("openNotifications")}
                aria-haspopup="dialog"
                aria-expanded={isNotificationOpen}
              >
                <Bell className="h-5 w-5" />

                {unreadCount > 0 && (
                  // <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white">
                  //   {unreadCount}
                  // </span>
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-black" />
                )}
              </button>

              <LocaleSwitcher />

              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen((prev) => !prev);
                    setIsNotificationOpen(false);
                  }}
                  className="flex items-center justify-center text-gray-600 transition hover:text-black"
                  aria-label={t("openProfileMenu")}
                >
                  <User className="h-5 w-5" />
                </button>

                {isProfileOpen && <ProfileMenu />}
              </div>
            </div>

            <NotificationDrawer
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
              notifications={notifications}
              unreadCount={unreadCount}
              isLoading={isLoading}
              loadError={loadError}
              hasMore={hasMore}
              onRetry={retryNotifications}
              onLoadMore={loadMore}
              onItemRead={markOneRead}
              onMarkAllRead={markAllRead}
            />
          </>
        ) : (
          <div className="flex items-center gap-3">
            <LocaleSwitcher />

            <Link
              href="/login"
              onClick={(e) => handleLinkClick(e, "/login")}
              className="text-sm font-medium text-black hover:text-gray-600"
            >
              {t("login")}
            </Link>

            <Link
              href="/signup"
              onClick={(e) => handleLinkClick(e, "/signup")}
              className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              {t("getStarted")}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
