import Header from "@/components/Header";
import Link from "next/link";

export default function HomePage() {
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
      <section className="flex justify-center gap-20 py-20 border-t border-gray-200">
        <div className="text-center">
          <p className="text-lg font-semibold">코드 리뷰</p>
          <p className="text-sm text-gray-500 mt-2">설명...</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold">팀원 모집</p>
          <p className="text-sm text-gray-500 mt-2">설명...</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold">포트폴리오</p>
          <p className="text-sm text-gray-500 mt-2">설명...</p>
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
