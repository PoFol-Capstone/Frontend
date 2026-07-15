import { getSession } from "@/lib/session";
import { getLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect({ href: "/board", locale: await getLocale() });
  return (
    <main className="min-h-screen bg-white text-black">
      {/* 히어로 */}
      <section className="flex flex-col items-center justify-center text-center py-32 gap-6">
        <h2 className="text-3xl font-bold">
          대학생 개발자를 위한 협업 포트폴리오 플랫폼
        </h2>
        <p className="text-gray-600">
          코드 리뷰, 팀원 모집, 프로젝트 관리를 한 곳에서
        </p>

        <div className="flex gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-black border px-6 py-3 text-sm text-white"
          >
            시작하기
          </Link>

          <Link
            href="/login"
            className="border rounded-lg bg-white px-6 py-3 text-sm text-black"
          >
            로그인
          </Link>
        </div>
      </section>

      {/* 기능 소개 */}
      <section className="border-t border-gray-200">
        {/* 코드 리뷰 */}
        <div className="bg-gray-50 py-20">
          <div className="max-w-2xl mx-auto px-6 flex gap-6 items-start">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-black flex items-center justify-center mt-1">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-2">01</p>
              <p className="text-xl font-bold mb-3">코드 리뷰</p>
              <p className="text-gray-600 leading-relaxed">
                팀원의 코드에 인라인 댓글을 남기고 피드백을 주고받으세요.
                <br />
                어떤 줄에서 어떤 의도로 작성했는지 맥락과 함께 리뷰하면
                <br />
                코드 품질과 팀 전체의 실력이 함께 올라갑니다.
              </p>
            </div>
          </div>
        </div>

        {/* 팀원 모집 */}
        <div className="bg-stone-50 py-20">
          <div className="max-w-2xl mx-auto px-6 flex gap-6 items-start">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-stone-700 flex items-center justify-center mt-1">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.874M9 20H4v-2a4 4 0 015-3.874M15 7a4 4 0 11-8 0 4 4 0 018 0zm6 4a3 3 0 11-6 0 3 3 0 016 0zM3 11a3 3 0 116 0 3 3 0 01-6 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-stone-500 uppercase mb-2">02</p>
              <p className="text-xl font-bold mb-3">팀원 모집</p>
              <p className="text-gray-600 leading-relaxed">
                기술 스택과 관심사를 기반으로 프로젝트에 맞는 동료를 찾으세요.
                <br />
                백엔드가 필요한지, 디자이너가 필요한지 공고를 올리면
                <br />
                비슷한 목표를 가진 대학생 개발자들이 지원합니다.
              </p>
            </div>
          </div>
        </div>

        {/* 포트폴리오 */}
        <div className="bg-slate-50 py-20">
          <div className="max-w-2xl mx-auto px-6 flex gap-6 items-start">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-700 flex items-center justify-center mt-1">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-2">03</p>
              <p className="text-xl font-bold mb-3">포트폴리오</p>
              <p className="text-gray-600 leading-relaxed">
                완료된 프로젝트가 자동으로 나만의 포트폴리오로 정리됩니다.
                <br />
                어떤 기술을 썼고, 어떤 역할을 맡았는지 한눈에 보여주는
                <br />
                개발 이력을 쉽게 만들고 공유할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-24 border-t border-gray-200">
        <p className="text-xl font-semibold mb-4">지금 바로 시작하세요</p>
        <Link
          href="/signup"
          className="border rounded-lg bg-white px-6 py-3 text-sm text-black"
        >
          무료로 시작하기 →
        </Link>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 py-10 text-center text-sm text-gray-500">
        © 2026 PoFol
      </footer>
    </main>
  );
}
