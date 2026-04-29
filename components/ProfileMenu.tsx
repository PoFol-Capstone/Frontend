"use client";
import { logout } from "@/lib/session";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const MENU_ITEMS = [
  { label: "프로필", href: "/profile" },
  { label: "협업", href: "/recruitment" },
  { label: "북마크", href: "/bookmark" },
  { label: "설정", href: "/settings" },
];

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="text-lg leading-none"
        aria-label="프로필 메뉴 열기"
      >
        👤
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg z-50">
          {MENU_ITEMS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
            >
              <span>{label}</span>
            </Link>
          ))}
          <div className="border-t border-gray-100">
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <span>로그아웃</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
