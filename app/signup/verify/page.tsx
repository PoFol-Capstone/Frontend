"use client";

import { login, register, verifyOtp } from "@/lib/auth";
import { saveLogin } from "@/lib/session";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function SignupVerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const singupEmail = sessionStorage.getItem("signupEmail");
    const loginEmail = sessionStorage.getItem("loginEmail");
    const savedEmail = singupEmail || loginEmail;

    if (!savedEmail) {
      router.push("/signup/email");
      return;
    }

    setEmail(savedEmail);
    inputRefs.current[0]?.focus();
  }, [router]);

  const handleChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = Array(6).fill("");
    pasted.split("").forEach((char, i) => {
      next[i] = char;
    });
    setDigits(next);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  useEffect(() => {
    if (digits.every((d) => d !== "")) {
      verify(digits.join(""));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  const verify = async (code: string) => {
    if (code.length !== 6) {
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
      let accessToken: string;
      let refreshToken: string;

      if (result.newUser) {
        const name = sessionStorage.getItem("signupName") ?? "";
        const authResult = await register(email, name);
        uuid = authResult.uuid;
        accessToken = authResult.accessToken;
        refreshToken = authResult.refreshToken;
        sessionStorage.removeItem("signupName");
        sessionStorage.removeItem("signupEmail");
      } else {
        const authResult = await login(email, code);
        uuid = authResult.uuid;
        accessToken = authResult.accessToken;
        refreshToken = authResult.refreshToken;
      }

      await saveLogin(email, uuid, accessToken, refreshToken);
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
          className="mt-8 flex w-full flex-col items-center gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            verify(digits.join(""));
          }}
        >
          <div className="flex gap-3">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="h-14 w-11 rounded-lg border-2 border-gray-200 text-center text-xl font-semibold outline-none transition-colors focus:border-black"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-3 text-center text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "확인 중..." : "인증 완료"}
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-red-500">{message}</p>}

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
