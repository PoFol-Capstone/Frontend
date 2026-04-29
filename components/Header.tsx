"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isLoggedIn } from "@/lib/session";

export default function Header() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setMounted(true);

    setIsNotificationOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  if (!mounted) return null;

  return (
    <header className="border-b border-gray-200 bg-white px-10 py-4">
      <div className="mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          PoFol
        </Link>

        {loggedIn ? (
          <>
            <div className="mx-10 flex flex-1 justify-center">
              <div className="flex w-full max-w-md items-center rounded-xl border border-gray-200 px-4 py-2">
                <span className="text-gray-400">🔍</span>
                <input
                  placeholder="Search Project..."
                  className="ml-2 w-full text-sm outline-none"/>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/board/write"
                className="flex h-9 w-9 items-center justify-center rounded-full text-lg hover:bg-gray-100"
                title="프로젝트 등록">
                ➕
              </Link>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationOpen((prev) => !prev);
                    setIsProfileOpen(false);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-lg hover:bg-gray-100"
                  title="알림">
                  🔔
                </button>

                {isNotificationOpen && (
                  <div className="absolute right-0 top-11 z-50 w-72 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-sm font-bold">알림</h2>
                      <span className="text-xs text-gray-400">최근 알림</span>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="rounded-xl bg-gray-50 p-3">
                        "user"님이 팔로우했습니다.
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3">
                        "user"님이 게시글을 저장했습니다.
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3">
                        "user"님이 프로젝트에 지원했습니다.
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3">
                        게시글에 새로운 댓글이 달렸습니다.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen((prev) => !prev);
                    setIsNotificationOpen(false);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-lg hover:bg-gray-100"
                  title="프로필">
                  👤
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 top-11 z-50 w-48 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
                    <Link
                      href="/profile"
                      className="block rounded-xl px-4 py-2 text-sm hover:bg-gray-50">
                      Profile
                    </Link>
                    <Link
                      href="/recruitment"
                      className="block rounded-xl px-4 py-2 text-sm hover:bg-gray-50">
                      Recruitment
                    </Link>
                    <Link
                      href="/bookmarks"
                      className="block rounded-xl px-4 py-2 text-sm hover:bg-gray-50">
                      Bookmark
                    </Link>
                    <Link
                      href="/settings"
                      className="block rounded-xl px-4 py-2 text-sm hover:bg-gray-50">
                      Settings
                    </Link>
                    <button
                      type="button"
                      className="mt-1 w-full rounded-xl px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50">
                      log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex gap-4">
            <Link
              href="/login"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
              로그인
            </Link>

            <Link
              href="/signup"
              className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800">
              시작하기
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}