"use client";

import { login, register, verifyOtp } from "@/lib/auth";
import { saveLogin } from "@/lib/session";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SignupVerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const singupEmail = sessionStorage.getItem("signupEmail");
    const loginEmail = sessionStorage.getItem("loginEmail");
    const savedEmail = singupEmail || loginEmail;

    if (!savedEmail) {
      router.push("/signup/email");
      return;
    }

    setEmail(savedEmail);
  }, [router]);

  const handleVerify = async () => {
    if (code.trim().length !== 6) {
      setMessage("6자리 인증번호를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const result = await verifyOtp(email, code);

      if (!result.verified) {
        setMessage("인증번호가 올바르지 않습니다.");
        return;
      }

      let uuid: string;

      if (result.newUser) {
        const name = sessionStorage.getItem("signupName") ?? "";
        const authResult = await register(email, name);
        uuid = authResult.uuid;
        sessionStorage.removeItem("signupName");
        sessionStorage.removeItem("signupEmail");
      } else {
        const authResult = await login(email);
        uuid = authResult.uuid;
      }

      await saveLogin(email, uuid);
      sessionStorage.removeItem("loginEmail");
      const callbackUrl = sessionStorage.getItem("callbackUrl") ?? "/board";
      sessionStorage.removeItem("callbackUrl");
      window.location.href = callbackUrl;
    } catch (error) {
      console.error(error);
      setMessage("인증 확인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-16">
      <section className="mx-auto flex w-full max-w-md flex-col items-center rounded-2xl px-8 py-12">
        <h1 className="mb-2 text-3xl font-bold">인증번호 확인</h1>

        <form
          className="mt-2 flex w-full flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
        >
          <input
            id="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="6자리 인증번호를 입력하세요"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded-lg border px-4 py-3 text-sm outline-none placeholder:text-gray-400"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-black px-4 py-3 text-center text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "확인 중..." : "인증 완료"}
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-gray-500">{message}</p>}

        <button
          type="button"
          onClick={() => router.push("/signup/email")}
          className="mt-8 text-sm text-gray-500 underline"
        >
          뒤로가기
        </button>
      </section>
    </main>
  );
}
