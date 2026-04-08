import Link from "next/link";

export default function SignupEmailPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-16">
      <section className="mx-auto flex w-full max-w-md flex-col items-center rounded-2xl px-8 py-12">
        <h1 className="mb-6 text-3xl font-bold">회원가입</h1>

        <form className="mt-2 flex w-full flex-col gap-4">
          <input
            id="email"
            type="email"
            placeholder="이메일을 입력하세요"
            className="rounded-lg border px-4 py-3 text-sm outline-none placeholder:text-gray-400"
          />

          <Link
            href="/signup/verify"
            className="mt-2 rounded-lg bg-black px-4 py-3 text-center text-sm font-medium text-white"
          >
            인증코드 받기
          </Link>
        </form>

        <p className="mt-8 text-sm text-gray-500">
          <Link href="/signup/type" className="font-medium text-gray-500 underline">
            다른 옵션으로 로그인
          </Link>
        </p>
      </section>
    </main>
  );
}