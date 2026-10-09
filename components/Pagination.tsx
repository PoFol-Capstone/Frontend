"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buildPageHref, visiblePageItems } from "@/lib/pagination";
import { ChevronIcon } from "./ChevronIcon";
import { useNavigation } from "./NavigationProvider";

type PaginationProps = {
  /** 0부터 시작하는 현재 페이지 (서버 응답의 number) */
  page: number;
  /** 서버 응답의 totalPages */
  totalPages: number;
  /** 목록 경로 (locale 접두사 없이, 예: "/board") */
  pathname: string;
  /** 페이지 이동 시 유지할 쿼리 (카테고리·검색어 등) */
  query?: Record<string, string | undefined>;
};

const arrowClass =
  "flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition";

/**
 * 서버 페이지네이션 링크. 페이지 상태를 URL(`?page=`)에 두어 뒤로가기·언어 전환·새로고침에도
 * 같은 페이지가 유지되고, 실제 링크라서 키보드(Tab/Enter)로 이동할 수 있다.
 */
export function Pagination({ page, totalPages, pathname, query = {} }: PaginationProps) {
  const t = useTranslations("common.pagination");
  const { handleLinkClick } = useNavigation();

  if (totalPages <= 1) return null;

  const hrefFor = (index: number) => buildPageHref(pathname, query, index);
  const prev = page > 0 ? hrefFor(Math.min(page, totalPages) - 1) : null;
  const next = page < totalPages - 1 ? hrefFor(page + 1) : null;

  return (
    <nav aria-label={t("label")} className="mt-10 flex items-center justify-center gap-3">
      {prev ? (
        <Link
          href={prev}
          onClick={(e) => handleLinkClick(e, prev)}
          aria-label={t("previous")}
          className={`${arrowClass} hover:border-gray-400 hover:bg-gray-50 hover:text-black`}
        >
          <ChevronIcon direction="left" />
        </Link>
      ) : (
        <span aria-hidden="true" className={`${arrowClass} opacity-30`}>
          <ChevronIcon direction="left" />
        </span>
      )}

      <div className="flex items-center gap-1">
        {visiblePageItems(page, totalPages).map((item, index) =>
          item === "gap" ? (
            <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-sm text-gray-400">
              …
            </span>
          ) : (
            <Link
              key={item}
              href={hrefFor(item)}
              onClick={(e) => handleLinkClick(e, hrefFor(item))}
              aria-label={t("page", { page: item + 1 })}
              aria-current={item === page ? "page" : undefined}
              className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm transition ${
                item === page
                  ? "bg-black font-semibold text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-black"
              }`}
            >
              {item + 1}
            </Link>
          ),
        )}
      </div>

      {next ? (
        <Link
          href={next}
          onClick={(e) => handleLinkClick(e, next)}
          aria-label={t("next")}
          className={`${arrowClass} hover:border-gray-400 hover:bg-gray-50 hover:text-black`}
        >
          <ChevronIcon direction="right" />
        </Link>
      ) : (
        <span aria-hidden="true" className={`${arrowClass} opacity-30`}>
          <ChevronIcon direction="right" />
        </span>
      )}
    </nav>
  );
}
