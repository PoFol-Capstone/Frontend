import { getSession } from "@/lib/session";
import { getSchoolCookie } from "@/lib/school";
import Header from "@/components/Header";
import BrandLogo from "@/components/BrandLogo";

/**
 * 세션 쿠키를 읽어 Header에 넘기는 서버 컴포넌트.
 *
 * Cache Components가 켜져 있으면 `cookies()` 같은 런타임 API는 반드시 `<Suspense>`
 * 안에서만 접근할 수 있다. 루트 레이아웃이 직접 쿠키를 읽으면 모든 라우트의 static
 * shell이 통째로 막히므로, 쿠키 읽기를 이 컴포넌트로 떼어내 레이아웃에서
 * `<Suspense fallback={<HeaderFallback />}>`로 감싼다.
 */
export default async function HeaderSlot() {
  const [session, school] = await Promise.all([getSession(), getSchoolCookie()]);
  return <Header session={session} school={school} />;
}

/** static shell에 들어가는 헤더 자리 — 실제 헤더와 높이가 같아야 레이아웃이 흔들리지 않는다 */
export function HeaderFallback() {
  return (
    <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-10">
      <div className="mx-auto flex min-h-9 items-center justify-between">
        <BrandLogo />
        <div className="h-9" />
      </div>
    </header>
  );
}
