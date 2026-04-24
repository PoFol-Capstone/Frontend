"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isLoggedIn, logout } from "@/lib/session";

export default function Header() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setMounted(true);
  }, [pathname]); //페이지 이동 시 로그인 상태를 다시 반영하기 위해 사용

  const handleLogout = () => {
    logout();
    window.location.href = "/"; //새로고침
  };

  if (!mounted) return null;

  return (
    <header className="border-b border-gray-200 px-10 py-4">
      <div className="mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          PoFol
        </Link>

        {loggedIn ? (
          <>
            {/* 로그인 상태 */}
            <div className="mx-10 flex flex-1 justify-center">
              <div className="flex w-full max-w-md items-center rounded-xl border px-4 py-2">
                🔍
                <input
                  placeholder="Search Project..."
                  className="ml-2 w-full outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-5 text-lg">
              <Link href="/board/write">➕</Link>
              <button>🔔</button>
              <Link href="/profile">👤</Link>
            </div>
          </>
        ) : (
          <>
            {/* 비로그인 상태 */}
            <div className="flex gap-4">
              <Link
                href="/login"
                className="rounded-lg border px-4 py-2 text-sm"
              >
                로그인
              </Link>

              <Link
                href="/signup"
                className="rounded-lg bg-black px-4 py-2 text-sm text-white"
              >
                시작하기
              </Link>
            </div>
          </>
        )}
      </div>
    </header>
  );
}