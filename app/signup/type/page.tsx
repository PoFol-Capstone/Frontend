import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-16">
      <section className="mx-auto flex w-full max-w-md flex-col items-center px-8 py-12">
        <h1 className="mb-6 text-3xl font-bold">새 계정을 만들어보세요!</h1>

        <div className="mt-2 flex w-full flex-col gap-4">
          <Link
            href="/signup/email"
            className="rounded-lg border px-4 py-3 text-center text-sm font-medium hover:bg-gray-50"
          >
            이메일로 시작하기
          </Link>

          <button
            type="button"
            className="mt-2 rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:opacity-90"
          >
            GitHub로 로그인
          </button>
        </div>
      </section>
    </main>
  );
}