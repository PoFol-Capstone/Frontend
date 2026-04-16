"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { sendOtp } from "@/api/auth";

export default function SignupEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedName = sessionStorage.getItem("signupName");
    if (!savedName) {
      router.push("/signup");
    }
  }, [router]);

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setMessage("이메일을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await sendOtp(email);

      sessionStorage.setItem("signupEmail", email);
      setMessage("인증 코드가 발송되었습니다.");
      router.push("/signup/verify");
    } catch (error) {
      console.error(error);
      setMessage("인증 코드 발송에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-16">
      <section className="mx-auto flex w-full max-w-md flex-col items-center rounded-2xl px-8 py-12">
        <h1 className="mb-6 text-3xl font-bold">회원가입</h1>

        <form
          className="mt-2 flex w-full flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendOtp();
          }}
        >
          <input
            id="email"
            type="email"
            placeholder="이메일을 입력하세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border px-4 py-3 text-sm outline-none placeholder:text-gray-400"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-black px-4 py-3 text-center text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "전송 중..." : "인증코드 받기"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-gray-500">{message}</p>
        )}

        <p className="mt-8 text-sm text-gray-500">
          <Link
            href="/signup/type"
            className="font-medium text-gray-500 underline"
          >
            다른 옵션으로 회원가입
          </Link>
        </p>

        <p className="mt-8 text-sm text-gray-500">
          ※ 학교 이메일로 가입하시면 많은 혜택을 받으실 수 있습니다.
        </p>
      </section>
    </main>
  );
}