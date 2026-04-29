"use client";

import ProfileMenu from "@/components/ProfileMenu";
import Link from "next/link";
import { useState } from "react";

type Notification = {
  id: number;
  type: "follow" | "bookmark" | "apply" | "like";
  username: string;
};

const notifications: Notification[] = [
  { id: 1, type: "follow", username: "user" },
  { id: 2, type: "bookmark", username: "user" },
  { id: 3, type: "apply", username: "user" },
  { id: 4, type: "like", username: "user" },
];

function getNotificationMessage(notification: Notification) {
  switch (notification.type) {
    case "follow":
      return `${notification.username}님이 팔로우했습니다.`;
    case "bookmark":
      return `${notification.username}님이 게시글을 저장했습니다.`;
    case "apply":
      return `${notification.username}님이 프로젝트에 지원했습니다.`;
    case "like":
      return `${notification.username}님이 좋아요를 눌렀습니다.`;
  }
}

export default function Header({ session }: { session: string | null }) {
  const isLoggedIn = !!session;

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="border-b border-gray-200 bg-white px-10 py-4">
      <div className="mx-auto flex items-center justify-between">
        <Link href={isLoggedIn ? "/board" : "/"} className="text-xl font-bold">
          PoFoL
        </Link>

        {isLoggedIn ? (
          <div className="flex items-center gap-4">
            <Link href="/board/write" className="text-xl">
              ➕
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsNotificationOpen((prev) => !prev);
                  setIsProfileOpen(false);
                }}
                className="text-xl"
                aria-label="알림 열기"
              >
                🔔
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 top-9 z-50 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  <div className="flex flex-col">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-gray-50"
                      >
                        <span>{getNotificationMessage(notification)}</span>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-gray-100">
                    <Link
                      href="/notifications"
                      onClick={() => setIsNotificationOpen(false)}
                      className="block px-4 py-3 text-center text-sm font-medium text-blue-600 transition-colors hover:bg-gray-50"
                    >
                      전체 보기
                    </Link>
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
                className="text-xl"
                aria-label="프로필 메뉴 열기"
              >
                👤
              </button>

              {isProfileOpen && <ProfileMenu />}
            </div>
          </div>
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