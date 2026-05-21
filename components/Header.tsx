"use client";

import NotificationDrawer from "@/components/NotificationDrawer";
import ProfileMenu from "@/components/ProfileMenu";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Bell, Search, CirclePlus, User } from "lucide-react";

type Notification = {
  id: number;
  type: "follow" | "bookmark" | "apply" | "like";
  username: string;
  read: boolean;
};

export default function Header({ session }: { session: string | null }) {
  const isLoggedIn = !!session;

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, type: "follow", username: "user", read: false },
    { id: 2, type: "bookmark", username: "user", read: false },
    { id: 3, type: "apply", username: "user", read: true },
    { id: 4, type: "like", username: "user", read: true },
  ]);

  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        read: true,
      })),
    );
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
        <Link href={isLoggedIn ? "/board" : "/"} className="text-xl font-bold">
          PoFoL
        </Link>

        {isLoggedIn ? (
          <>
            <div className="flex flex-1 justify-center px-10">
              <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Project..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/board/write"
                className="flex items-center justify-center text-gray-600 transition hover:text-black"
                aria-label="게시글 작성"
              >
                <CirclePlus className="h-5 w-5" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsNotificationOpen(true);
                  setIsProfileOpen(false);
                }}
                className="relative flex items-center justify-center text-gray-600 transition hover:text-black"
                aria-label="알림 열기"
              >
                <Bell className="h-5 w-5" />

                {unreadCount > 0 && (
                  // <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white">
                  //   {unreadCount}
                  // </span>
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-black" />
                )}
              </button>

              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen((prev) => !prev);
                    setIsNotificationOpen(false);
                  }}
                  className="flex items-center justify-center text-gray-600 transition hover:text-black"
                  aria-label="프로필 메뉴 열기"
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
              onMarkAllRead={handleMarkAllRead}
            />
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-black hover:text-gray-600"
            >
              로그인
            </Link>

            <Link
              href="/signup"
              className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              시작하기
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}