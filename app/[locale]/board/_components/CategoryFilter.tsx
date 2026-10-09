"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useNavigation } from "@/components/NavigationProvider";
import { boardHref, CATEGORIES, type Category } from "./categories";

const CATEGORY_LABEL_KEYS: Record<Category, string> = {
  All: "all",
  Recruiting: "recruiting",
  School: "school",
  Bookmarks: "bookmarks",
};

interface Props {
  selected: Category;
}

export default function CategoryFilter({ selected }: Props) {
  const t = useTranslations("board.categories");
  const { handleLinkClick } = useNavigation();

  return (
    <nav aria-label={t("label")} className="mb-8 flex flex-wrap gap-2">
      {CATEGORIES.map((category) => {
        const href = boardHref(category);
        return (
          <Link
            key={category}
            href={href}
            onClick={(e) => handleLinkClick(e, href)}
            aria-current={selected === category ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              selected === category
                ? "bg-black text-white"
                : "border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-black"
            }`}
          >
            {t(CATEGORY_LABEL_KEYS[category])}
          </Link>
        );
      })}
    </nav>
  );
}
