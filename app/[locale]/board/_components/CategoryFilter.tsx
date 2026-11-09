"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useNavigation } from "@/components/NavigationProvider";
import { boardHref, CATEGORIES, type Category } from "./categories";

const CATEGORY_LABEL_KEYS: Record<Category, string> = {
  All: "all",
  School: "school",
  Bookmarks: "bookmarks",
};

interface Props {
  selected: Category;
}

export default function CategoryFilter({ selected }: Props) {
  const t = useTranslations("board.categories");
  const tHeader = useTranslations("header");
  const { handleLinkClick } = useNavigation();

  return (
    <nav aria-label={t("label")} className="mb-8 flex flex-wrap gap-x-6 border-b border-gray-200">
      {CATEGORIES.map((category) => {
        const href = boardHref(category);
        return (
          <Link
            key={category}
            href={href}
            onClick={(e) => handleLinkClick(e, href)}
            aria-current={selected === category ? "page" : undefined}
            className={`-mb-px border-b-2 pb-3 text-sm font-medium transition ${
              selected === category
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-900"
            }`}
          >
            {t(CATEGORY_LABEL_KEYS[category])}
          </Link>
        );
      })}
      {/* 게시판이 헤더 메뉴에서 빠져 글쓰기 입구를 게시판 안으로 옮겼다 */}
      <Link
        href="/board/write"
        onClick={(e) => handleLinkClick(e, "/board/write")}
        className="-mb-px ml-auto pb-3 text-sm font-medium text-gray-900 hover:text-gray-500"
      >
        {tHeader("createPost")}
      </Link>
    </nav>
  );
}
