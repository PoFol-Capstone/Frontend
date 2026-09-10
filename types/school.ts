/** GET /api/auth/school/status 응답 */
export type SchoolStatus = {
  verified: boolean;
  /** 영문명 (예: Kangnam University) */
  schoolName: string | null;
  /** 한글명 (예: 강남대학교) */
  schoolNameKo: string | null;
  /** 학교 도메인 (예: kangnam.ac.kr) */
  domain: string | null;
};

/** 헤더 표시용으로 `school` 쿠키에 담아두는 최소 정보 */
export type SchoolNames = {
  ko: string;
  en: string;
};
