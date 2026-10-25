import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export type ProfileTab = "posts" | "github";

export function parseProfileTab(value: string | undefined): ProfileTab {
  return value === "github" ? "github" : "posts";
}

/** 내 프로필의 게시물 / GitHub 탭 (?tab=github) — 링크라 새로고침·공유해도 같은 탭이 열린다 */
export default async function ProfileTabs({ active }: { active: ProfileTab }) {
  const t = await getTranslations("profile.tabs");
  const tabs: { id: ProfileTab; href: string }[] = [
    { id: "posts", href: "/profile" },
    { id: "github", href: "/profile?tab=github" },
  ];
  return (
    <nav aria-label={t("label")} className="flex gap-6 border-b border-gray-200">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          aria-current={active === tab.id ? "page" : undefined}
          className={`-mb-px border-b-2 pb-3 text-lg font-semibold transition ${
            active === tab.id ? "border-black text-black" : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          {t(tab.id)}
        </Link>
      ))}
    </nav>
  );
}
