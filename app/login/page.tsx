import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-16">
      <section className="mx-auto flex w-full max-w-md flex-col items-center rounded-2xl px-8 py-12">
        <h1 className="mb-6 text-3xl font-bold">로그인</h1>

        <form className="mt-4 flex w-full flex-col gap-4">
          <div className="flex flex-col gap-2">

            <input
              id="email"
              type="email"
              placeholder="이메일을 입력하세요"
              className="rounded-lg border px-4 py-3 text-sm outline-none placeholder:text-gray-400"
            />
          </div>

          <Link
          href="/board"
          className="mt-2 rounded-lg bg-black px-4 py-3 text-center text-sm font-medium text-white"
          >
            로그인
          </Link>
        </form>

        <div className="my-6 flex w-full items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">또는</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            className="rounded-lg border px-4 py-3 text-sm font-medium"
          >
            GitHub로 계속하기
          </button>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          아직 계정이 없으신가요?{" "}
          <a href="/signup" className="font-medium text-black underline">
            회원가입
          </a>
        </p>
      </section>
    </main>
  );
}