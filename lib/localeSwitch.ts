/**
 * 언어를 바꿀 때 이동할 주소. 예전엔 경로만 넘겨서 /search?q=react에서 언어를 바꾸면 q가
 * 사라져 검색 결과가 비었다. 경로(locale 접두사 없음)에 현재 query와 hash를 그대로 붙인다.
 *
 * @param pathname next-intl usePathname() 값 (예: "/search")
 * @param search window.location.search (예: "?q=react&category=School")
 * @param hash window.location.hash (예: "#comments")
 */
export function buildLocaleSwitchHref(
  pathname: string,
  search: string,
  hash: string,
): string {
  const query = search && search !== "?" ? (search.startsWith("?") ? search : `?${search}`) : "";
  const fragment = hash && hash !== "#" ? (hash.startsWith("#") ? hash : `#${hash}`) : "";
  return `${pathname}${query}${fragment}`;
}
