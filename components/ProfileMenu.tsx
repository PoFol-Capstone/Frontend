"use client";

import { logout } from "@/lib/session";
import Link from "next/link";

const MENU_ITEMS = [
  { label: "Profile", href: "/profile" },
  { label: "Recruitment", href: "/recruitment" },
  { label: "Bookmarks", href: "/bookmark" },
  { label: "Settings", href: "/settings" },
];

export default function ProfileMenu() {
  return (
    <div className="absolute right-0 top-9 z-50 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
      {MENU_ITEMS.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-gray-50"
        >
          <span>{label}</span>
        </Link>
      ))}

      <div className="border-t border-gray-100">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-500 transition-colors hover:bg-red-50"
          >
            <span>Log out</span>
          </button>
        </form>
      </div>
    </div>
  );
}