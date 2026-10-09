"use client";

import { useSessionToast } from "@/hooks/useSessionToast";
import { signInWithEmailOtp } from "@/lib/auth";
import {
  finishAuthFlow,
  handOffToSignup,
  readPendingAuth,
  type PendingAuth,
} from "@/lib/authFlow";
import { resolvePostLoginPath } from "@/lib/safeRedirect";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import OtpInput, { OTP_LENGTH } from "@/components/OtpInput";

export default function SignupVerifyPage() {
  const t = useTranslations("auth.verify");
  const locale = useLocale();
  const router = useRouter();
  const [pending, setPending] = useState<PendingAuth | null>(null);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const toastMessage = useSessionToast("toastMessage");

  useEffect(() => {
    // 진행 중인 흐름(로그인/회원가입)의 이메일 하나만 쓴다 — 다른 흐름의 이메일과 섞지 않는다
    const saved = readPendingAuth(sessionStorage);

    if (!saved) {
      router.push("/login");
      return;
    }

    setPending(saved);
  }, [router]);

  const verify = async (code: string) => {
    if (!pending) return;
    if (code.length !== 6) {
      setMessage(t("codeRequired"));
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      // 토큰은 서버에서 바로 쿠키로 저장되고 브라우저로 넘어오지 않는다
      const result = await signInWithEmailOtp(
        pending.email,
        code,
        pending.flow === "signup" ? pending.name : undefined,
      );

      switch (result.status) {
        case "signedIn": {
          // 기존 계정으로 가입 화면을 거쳐 로그인한 경우까지 흐름 상태를 전부 정리한다
          const callbackUrl = finishAuthFlow(sessionStorage);
          // 이동 직전에 같은 origin의 내부 경로인지 다시 확인한다
          window.location.assign(
            resolvePostLoginPath(callbackUrl, window.location.origin, locale),
          );
          return;
        }
        case "needSignup":
          // 로그인 화면에서 들어온 미가입 이메일 — 이름을 받은 적이 없으니
          // 빈 이름으로 회원가입을 시도하지 않고 이름 입력부터 다시 받는다
          handOffToSignup(sessionStorage);
          setMessage(t("needSignup"));
          router.push("/signup");
          return;
        case "invalidCode":
          setMessage(t("invalidCode"));
          return;
        case "failed":
          setMessage(t("verifyFailed"));
          return;
      }
    } catch (error) {
      console.error(error);
      setMessage(t("verifyFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-16">
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toastMessage}
        </div>
      )}
      <section className="mx-auto flex w-full max-w-md flex-col items-center rounded-2xl px-8 py-12">
        <h1 className="mb-2 text-3xl font-bold">{t("title")}</h1>

        <form
          className="mt-8 flex w-full flex-col items-center gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            verify(digits.join(""));
          }}
        >
          <OtpInput
            digits={digits}
            onChange={setDigits}
            onComplete={verify}
            autoFocus
          />

          <button
            type="submit"
            disabled={loading || !pending}
            className="w-full rounded-lg bg-black px-4 py-3 text-center text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? t("verifying") : t("submit")}
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-red-500">{message}</p>}

        <button
          type="button"
          onClick={() =>
            router.push(pending?.flow === "login" ? "/login" : "/signup/email")
          }
          className="mt-8 text-sm text-gray-500 underline"
        >
          {t("back")}
        </button>
      </section>
    </main>
  );
}
