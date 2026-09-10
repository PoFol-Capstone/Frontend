"use client";

import NotificationDrawer from "@/components/NotificationDrawer";
import BrandLogo from "@/components/BrandLogo";
import ProfileMenu from "@/components/ProfileMenu";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { useNavigation } from "@/components/NavigationProvider";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useEffect, useRef, useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { useLocale, useTranslations } from "next-intl";
import { shortSchoolName } from "@/lib/schoolName";
import type { SchoolNames } from "@/types/school";

import { Bell, Search, CirclePlus, User } from "lucide-react";

export default function Header({
  session,
  school,
}: {
  session: string | null;
  /** 학교 인증을 마친 유저의 학교명. 미인증이면 null */
  school: SchoolNames | null;
}) {
  const t = useTranslations("header");
  const locale = useLocale();
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

  useEffect(() => {
    if (pathname === "/board") {
      setKeyword("");
    }
  }, [pathname]);

  const {
    unreadCount,
    notifications,
    hasMore,
    isLoading,
    isLoaded,
    loadFirstPage,
    loadMore,
    markOneRead,
    markAllRead,
  } = useNotifications(isLoggedIn);

  const profileRef = useRef<HTMLDivElement>(null);

  const handleOpenNotifications = () => {
    setIsNotificationOpen(true);
    setIsProfileOpen(false);
    if (!isLoaded) loadFirstPage();
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
            href={isLoggedIn ? "/board" : "/"}
            onClick={(e) => handleLinkClick(e, isLoggedIn ? "/board" : "/")}
            className="inline-flex shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            <BrandLogo />
          </Link>
          {school && (
            <Link
              href="/board?category=School"
              onClick={(e) => handleLinkClick(e, "/board?category=School")}
              className="ml-3 max-w-24 truncate text-sm font-medium text-gray-400 hover:text-gray-600 sm:ml-4 sm:max-w-40 sm:text-base"
            >
              | &nbsp;{shortSchoolName(school, locale)}
            </Link>
          )}
        </div>

        {isLoggedIn ? (
          <>
            <div className="order-last flex w-full justify-center sm:order-none sm:w-auto sm:min-w-0 sm:flex-1 sm:px-4 lg:px-10">
              <form
                onSubmit={handleSearch}
                className="flex w-full max-w-md items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                  />
              </form>
            </div>

            <div className="flex shrink-0 items-center gap-3 sm:gap-4">
              <Link
                href="/board/write"
                onClick={(e) => handleLinkClick(e, "/board/write")}
                className="flex items-center justify-center text-gray-600 transition hover:text-black"
                aria-label={t("createPost")}
              >
                <CirclePlus className="h-5 w-5" />
              </Link>

              <button
                type="button"
                onClick={handleOpenNotifications}
                className="relative flex items-center justify-center text-gray-600 transition hover:text-black"
                aria-label={t("openNotifications")}
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
              hasMore={hasMore}
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
