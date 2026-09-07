import type { SchoolNames } from "@/types/school";

/**
 * 헤더에 붙일 짧은 학교명을 만든다. "PoFoL | 강남대학교"는 길어서 로고를 밀어낸다.
 *
 *   ko: "강남대학교" → "강남대",  "서울교육대학교" → "서울교육대"
 *       "한국과학기술원"처럼 "학교"로 끝나지 않으면 그대로 둔다
 *   en: "Kangnam University" → "Kangnam"
 *
 * 순수 함수라서 서버/클라이언트 양쪽에서 쓸 수 있다("use server" 아님).
 */
export function shortSchoolName(names: SchoolNames, locale: string): string {
  return locale === "ko"
    ? names.ko.replace(/학교$/, "")
    : names.en.replace(/\s+University$/i, "");
}
