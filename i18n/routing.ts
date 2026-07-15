import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ko", "en"],
  defaultLocale: "ko",
  localePrefix: "as-needed",
  // 브라우저 Accept-Language 자동 감지 대신, 사용자가 헤더에서 수동으로 전환
  localeDetection: false,
});
