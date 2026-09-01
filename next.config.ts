import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// NOTE: Cache Components(`cacheComponents: true`)는 현재 켤 수 없다.
// `i18n/request.ts`의 `getRequestConfig`가 매 요청 `x-next-intl-locale` 헤더를 읽어
// 로케일을 해석하기 때문에 루트 레이아웃 자체가 런타임 의존이 되고, 그 결과
// 어떤 라우트도 static shell을 만들 수 없다("Uncached data was accessed outside
// of <Suspense>" at RootLayout). `use cache` / `unstable_instant`은 이 플래그가
// 있어야 동작하므로, next-intl의 정적 렌더링 셋업(모든 layout/page에서
// setRequestLocale 호출)을 먼저 정리한 뒤에 다시 시도해야 한다.
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
