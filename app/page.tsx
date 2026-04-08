import Header from "@/components/Header";

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
        <button className="bg-black text-white px-6 py-3 rounded">
          시작하기
        </button>
      </section>

      {/* 기능 소개 */}
      <section className="flex justify-center gap-20 py-20 border-t">
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
      <section className="text-center py-24 border-t">
        <p className="text-xl font-semibold mb-4">
          지금 바로 시작하세요
        </p>
        <button className="border px-6 py-2 rounded">
          무료로 시작하기 →
        </button>
      </section>

      {/* 푸터 */}
      <footer className="border-t py-10 text-center text-sm text-gray-500">
        © 2026 PoFol
      </footer>

    </main>
  );
}