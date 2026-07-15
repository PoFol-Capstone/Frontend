"use client";

import NotificationDrawer from "@/components/NotificationDrawer";
import ProfileMenu from "@/components/ProfileMenu";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { useNavigation } from "@/components/NavigationProvider";
import { Link, useRouter } from "@/i18n/navigation";
import { useEffect, useRef, useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslations } from "next-intl";

import { Bell, Search, CirclePlus, User } from "lucide-react";

export default function Header({ session }: { session: string | null }) {
  const t = useTranslations("header");
  const isLoggedIn = !!session;

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const router = useRouter();
  const { handleLinkClick } = useNavigation();
  const [keyword, setKeyword] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = keyword.trim();
    if (!trimmed) return;

    router.push('/search?q=${encodeURIComponent(trimmed)}');
  };

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
    <header className="border-b border-gray-200 bg-white px-10 py-4">
      <div className="mx-auto flex items-center justify-between">
        <Link
          href={isLoggedIn ? "/board" : "/"}
          onClick={(e) => handleLinkClick(e, isLoggedIn ? "/board" : "/")}
          className="text-xl font-bold"
        >
          PoFoL
        </Link>

        {isLoggedIn ? (
          <>
            <div className="flex flex-1 justify-center px-10">
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

            <div className="flex items-center gap-4">
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