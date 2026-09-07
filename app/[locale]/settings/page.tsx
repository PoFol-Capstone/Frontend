import { getTranslations } from "next-intl/server";
import { fetchSchoolStatus } from "@/lib/school";
import type { SchoolStatus } from "@/types/school";
import SettingsClient from "./_components/SettingsClient";
import SchoolVerificationCard from "./_components/SchoolVerificationCard";

export default async function SettingsPage() {
  const t = await getTranslations("settings");

  // 조회 실패 시 null을 넘긴다 — "미인증"으로 단정하면 이미 인증한 유저에게 거짓을 보여준다
  let schoolStatus: SchoolStatus | null = null;
  try {
    schoolStatus = await fetchSchoolStatus();
  } catch (error) {
    console.error("failed to load school status:", error);
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-8 py-8">
      <section className="max-w-3xl">
        <h1 className="text-2xl font-bold text-black">{t("title")}</h1>
        <p className="mt-3 text-sm text-gray-500">{t("subtitle")}</p>

        <div className="mt-8 space-y-4">
          <SchoolVerificationCard status={schoolStatus} />
          <SettingsClient />
        </div>
      </section>
    </main>
  );
}
