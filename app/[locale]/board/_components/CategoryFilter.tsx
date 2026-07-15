"use client";

import { useTranslations } from "next-intl";

const categories = ["All", "Recruiting", "School", "Bookmarks"] as const;

const CATEGORY_LABEL_KEYS: Record<(typeof categories)[number], string> = {
  All: "all",
  Recruiting: "recruiting",
  School: "school",
  Bookmarks: "bookmarks",
};

interface Props {
  selected: string;
  onSelect: (category: string) => void;
}

export default function CategoryFilter({ selected, onSelect }: Props) {
  const t = useTranslations("board.categories");

  return (
    <section className="mb-8 flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onSelect(category)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            selected === category
              ? "bg-black text-white"
              : "border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-black"
          }`}
        >
          {t(CATEGORY_LABEL_KEYS[category])}
        </button>
      ))}
    </section>
  );
}
