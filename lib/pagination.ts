/**
 * 서버 페이지네이션(Spring Page) ↔ URL `?page=` 변환.
 *
 * 목록 화면은 서버가 준 page/size/totalPages로만 페이지를 나눈다. 예전처럼 큰 size로
 * 한 번에 받아 로컬에서 자르면 그 범위를 넘는 데이터(오래된 글·북마크)에 닿을 수 없다.
 * URL에는 사람이 읽기 쉬운 1부터 시작하는 번호를 쓰고, 내부·백엔드는 0부터 센다.
 */

// 비정상적으로 큰 값으로 백엔드에 거대한 offset 쿼리를 보내지 않도록 상한을 둔다
const MAX_PAGE_NUMBER = 10_000;

/** `?page=` 값(1부터) → 0부터 시작하는 페이지 인덱스. 잘못된 값은 첫 페이지. */
export function parsePageParam(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  if (!Number.isInteger(page) || page < 1) return 0;
  return Math.min(page, MAX_PAGE_NUMBER) - 1;
}

/** 0부터 시작하는 페이지 인덱스로 목록 주소를 만든다. 첫 페이지는 page를 생략한다. */
export function buildPageHref(
  pathname: string,
  query: Record<string, string | undefined>,
  pageIndex: number,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  if (pageIndex > 0) params.set("page", String(pageIndex + 1));
  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}

/**
 * 페이지 버튼 목록. 페이지가 많으면 처음·끝·현재 주변만 보여주고 나머지는 "gap"으로 줄인다
 * (게시글 1,001개면 112페이지 — 버튼 112개를 다 그리지 않는다).
 */
export function visiblePageItems(
  page: number,
  totalPages: number,
  siblings = 1,
): (number | "gap")[] {
  const pages = new Set<number>([0, totalPages - 1]);
  for (let i = page - siblings; i <= page + siblings; i++) {
    if (i >= 0 && i < totalPages) pages.add(i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  sorted.forEach((value, index) => {
    const previous = sorted[index - 1];
    if (index > 0 && value - previous > 1) {
      // 한 칸만 비면 굳이 줄이지 않고 그 번호를 보여준다
      if (value - previous === 2) items.push(previous + 1);
      else items.push("gap");
    }
    items.push(value);
  });
  return items;
}
