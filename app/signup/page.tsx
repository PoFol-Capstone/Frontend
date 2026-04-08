import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-16">
      <section className="mx-auto flex w-full max-w-md flex-col items-center px-8 py-12">
        
        <h1 className="mb-6 text-3xl font-bold">
          이름을 입력하세요
        </h1>

        <form className="mt-2 flex w-full flex-col gap-4">
          <input
            type="text"
            placeholder="이름을 입력하세요."
            className="w-full rounded-lg border px-4 py-3 text-sm outline-none placeholder:text-gray-400"
          />

          <Link
            href="/signup/type"
            className="mt-2 rounded-lg bg-black px-4 py-3 text-center text-sm font-medium text-white"
          >
            다음 →
          </Link>
        </form>

      </section>
    </main>
  );
}