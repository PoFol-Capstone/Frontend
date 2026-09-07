"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import LocaleSwitcher from "@/components/LocaleSwitcher";

const NOTIFICATION_IDS = [
  "follow",
  "like",
  "bookmark",
  "apply",
  "recruit",
] as const;

/** 언어 · 알림 설정 카드. 학교 인증 카드가 서버 데이터를 필요로 해서 페이지에서 분리했다. */
export default function SettingsClient() {
  const t = useTranslations("settings");
  const tNotifications = useTranslations("settings.notifications");
  const [enabledNotifications, setEnabledNotifications] = useState(
    NOTIFICATION_IDS.reduce<Record<string, boolean>>((acc, item) => {
      acc[item] = true;
      return acc;
    }, {}),
  );

  const toggleNotification = (name: string) => {
    setEnabledNotifications((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  return (
    <>
      <section className="rounded-xl border border-gray-300 bg-white px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-black">
              {t("language.title")}
            </h2>
            <p className="mt-2 text-sm text-gray-500">{t("language.desc")}</p>
          </div>

          <LocaleSwitcher />
        </div>
      </section>

      <section className="rounded-xl border border-gray-300 bg-white px-5 py-4">
        <h2 className="text-lg font-bold text-black">
          {t("notifications.title")}
        </h2>
        <p className="mt-2 text-sm text-gray-500">{t("notifications.desc")}</p>

        <div className="mt-4 border-t border-gray-300 pt-3">
          {NOTIFICATION_IDS.map((item) => {
            const label = tNotifications(item);
            return (
              <div
                key={item}
                className="flex items-center justify-between py-1.5"
              >
                <span className="text-sm text-black">{label}</span>

                <button
                  type="button"
                  onClick={() => toggleNotification(item)}
                  className={`relative h-5 w-9 rounded-full transition ${
                    enabledNotifications[item] ? "bg-gray-900" : "bg-gray-300"
                  }`}
                  aria-label={tNotifications("toggleLabel", { name: label })}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
                      enabledNotifications[item] ? "left-[18px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
