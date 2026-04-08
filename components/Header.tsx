"use client";

import Link from "next/link";

type HeaderProps = {
  isLoggedIn?: boolean;
};

export default function Header({ isLoggedIn = false }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 px-10 py-4">
      <div className="mx-auto flex items-center justify-between">
        
        {/* 왼쪽: 로고 */}
        <Link href="/" className="text-xl font-bold">
          PoFol
        </Link>

        {isLoggedIn ? (
          <>
            {/* 가운데: 검색창 */}
            <div className="mx-10 flex flex-1 justify-center">
              <div className="flex w-full max-w-md items-center rounded-xl border border-gray-200 px-4 py-2">
                <span className="mr-2 text-lg">🔍</span>
                <input
                  type="text"
                  placeholder="Search Project..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* 오른쪽: 아이콘 */}
            <div className="flex items-center gap-5 text-lg">
              <button>➕</button>
              <button>🔔</button>
              <button>👤</button>
            </div>
          </>
        ) : (
          <div className="flex gap-4">
            <Link href="/login" className="rounded-lg border px-4 py-2 text-sm">
              로그인
            </Link>

            <Link
              href="/signup"
              className="rounded-lg bg-black px-4 py-2 text-sm text-white"
            >
              시작하기
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}