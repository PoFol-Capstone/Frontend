import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export type ProfileTab = "projects" | "github" | "posts";

/** 기본은 프로젝트 탭 — 로그인 후 첫 화면이 내 프로젝트다 */
export function parseProfileTab(value: string | undefined): ProfileTab {
  return value === "github" || value === "posts" ? value : "projects";
}

/** 내 프로필의 프로젝트 / GitHub / 게시물 탭 (?tab=) — 링크라 새로고침·공유해도 같은 탭이 열린다 */
export default async function ProfileTabs({ active }: { active: ProfileTab }) {
  const t = await getTranslations("profile.tabs");
  const tabs: { id: ProfileTab; href: string }[] = [
    { id: "projects", href: "/profile" },
    { id: "github", href: "/profile?tab=github" },
    { id: "posts", href: "/profile?tab=posts" },
  ];
  return (
    <nav aria-label={t("label")} className="flex gap-6 border-b border-gray-200">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          aria-current={active === tab.id ? "page" : undefined}
          className={`-mb-px border-b-2 pb-3 text-base font-semibold sm:text-lg transition ${
            active === tab.id ? "border-black text-black" : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          {t(tab.id)}
        </Link>
      ))}
    </nav>
  );
}
