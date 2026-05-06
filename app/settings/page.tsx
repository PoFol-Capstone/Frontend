"use client";

import { useState } from "react";

const notifications = [
  "팔로우 알림",
  "좋아요 알림",
  "북마크 알림",
  "지원 알림",
  "모집 알림",
];

export default function SettingsPage() {
  const [language, setLanguage] = useState("ko");
  const [enabledNotifications, setEnabledNotifications] = useState(
    notifications.reduce<Record<string, boolean>>((acc, item) => {
      acc[item] = true;
      return acc;
    }, {})
  );

  const toggleNotification = (name: string) => {
    setEnabledNotifications((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-8 py-8">
      <section className="max-w-3xl">
        <h1 className="text-2xl font-bold text-black">설정</h1>
        <p className="mt-3 text-sm text-gray-500">
          서비스 이용 환경을 설정할 수 있습니다.
        </p>

        <div className="mt-8 space-y-4">
          <section className="rounded-xl border border-gray-300 bg-white px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-black">언어 설정</h2>
                <p className="mt-2 text-sm text-gray-500">
                  서비스에서 표시할 언어를 선택할 수 있습니다.
                </p>
              </div>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="h-9 w-28 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none"
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </select>
            </div>
          </section>

          <section className="rounded-xl border border-gray-300 bg-white px-5 py-4">
            <h2 className="text-lg font-bold text-black">알림 설정</h2>
            <p className="mt-2 text-sm text-gray-500">
              팔로우, 좋아요, 북마크, 지원, 모집 관련 알림을 관리할 수
              있습니다.
            </p>

            <div className="mt-4 border-t border-gray-300 pt-3">
              {notifications.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between py-1.5"
                >
                  <span className="text-sm text-black">{item}</span>

                  <button
                    type="button"
                    onClick={() => toggleNotification(item)}
                    className={`relative h-5 w-9 rounded-full transition ${
                      enabledNotifications[item]
                        ? "bg-gray-900"
                        : "bg-gray-300"
                    }`}
                    aria-label={`${item} 설정`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
                        enabledNotifications[item]
                          ? "left-[18px]"
                          : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}