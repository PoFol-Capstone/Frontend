import Link from "next/link";

export default function SignupVerifyPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-16">
      <section className="mx-auto flex w-full max-w-md flex-col items-center rounded-2xl px-8 py-12">
        <h1 className="mb-3 text-3xl font-bold">Verification</h1>
        <p className="mb-8 text-center text-sm text-gray-500">
          이메일로 전송된 인증코드를 입력해주세요.
        </p>

        <div className="flex w-full justify-center gap-3">
          <input className="h-12 w-12 rounded-lg border text-center text-lg" maxLength={1} />
          <input className="h-12 w-12 rounded-lg border text-center text-lg" maxLength={1} />
          <input className="h-12 w-12 rounded-lg border text-center text-lg" maxLength={1} />
          <input className="h-12 w-12 rounded-lg border text-center text-lg" maxLength={1} />
          <input className="h-12 w-12 rounded-lg border text-center text-lg" maxLength={1} />
          <input className="h-12 w-12 rounded-lg border text-center text-lg" maxLength={1} />
        </div>

        <Link
          href="/login"
          className="mt-8 rounded-lg bg-black px-6 py-3 text-sm font-medium text-white"
        >
          확인
        </Link>

        <Link
          href="/signup/email"
          className="mt-6 text-sm text-gray-500 underline"
        >
          뒤로가기
        </Link>
      </section>
    </main>
  );
}