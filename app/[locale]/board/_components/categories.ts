import { buildPageHref } from "@/lib/pagination";

export const CATEGORIES = ["All", "Recruiting", "School", "Bookmarks"] as const;

export type Category = (typeof CATEGORIES)[number];

export function toCategory(value: string | null): Category {
  return (CATEGORIES as readonly string[]).includes(value ?? "")
    ? (value as Category)
    : "All";
}

/** 게시판 주소. 카테고리·페이지를 URL에 두어 뒤로가기·언어 전환에도 유지되게 한다. */
export function boardHref(category: Category, pageIndex = 0): string {
  return buildPageHref(
    "/board",
    { category: category === "All" ? undefined : category },
    pageIndex,
  );
}
