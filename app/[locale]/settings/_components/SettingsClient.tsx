"use client";

import { useTranslations } from "next-intl";
import LocaleSwitcher from "@/components/LocaleSwitcher";

/**
 * 언어 · 알림 설정 카드. 학교 인증 카드가 서버 데이터를 필요로 해서 페이지에서 분리했다.
 *
 * 알림 종류별 수신 설정은 백엔드에 저장·조회 API가 없다. 예전엔 로컬 state만 바뀌는 스위치를
 * 보여줘서 꺼도 알림이 계속 왔다 — 작동하는 설정처럼 보이지 않도록 미지원 안내로 바꿨다.
 */
export default function SettingsClient() {
  const t = useTranslations("settings");

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
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-black">
            {t("notifications.title")}
          </h2>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
            {t("notifications.unsupportedBadge")}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {t("notifications.unsupported")}
        </p>
      </section>
    </>
  );
}
