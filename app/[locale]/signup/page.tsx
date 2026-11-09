"use client";

import { useRouter } from "@/i18n/navigation";
import BrandLogo from "@/components/BrandLogo";
import { sendOtp } from "@/lib/auth";
import {
  beginLoginFlow,
  readLastLoginEmail,
  saveSignupName,
} from "@/lib/authFlow";
import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

const noSubscribe = () => () => {};

export default function SignupPage() {
  const t = useTranslations("auth.signupName");
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  // 서버 렌더에선 null, 브라우저에선 localStorage 값 — effect 안 setState 없이 하이드레이션을 맞춘다
  const lastEmail = useSyncExternalStore(noSubscribe, readLastLoginEmail, () => null);
  const [continuing, setContinuing] = useState(false);

  const handleNext = () => {
    if (!name.trim()) {
      setMessage(t("nameRequired"));
      return;
    }

    saveSignupName(sessionStorage, name.trim());
    router.push("/signup/type");
  };

  // 이전에 로그인했던 계정으로 바로 인증 코드를 받는다 (OTP 확인은 그대로 거친다)
  const continueWithLastEmail = async () => {
    if (!lastEmail) return;
    try {
      setContinuing(true);
      setMessage("");
      await sendOtp(lastEmail);
      beginLoginFlow(sessionStorage, lastEmail, null);
      router.push("/signup/verify");
    } catch (error) {
      console.error(error);
      setMessage(t("continueFailed"));
      setContinuing(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-16">
      <section className="mx-auto flex w-full max-w-md flex-col items-center px-8 py-12">
        <BrandLogo variant="symbol" className="mb-6" />

        {lastEmail && (
          <div className="mb-10 flex w-full flex-col gap-2">
            <button
              type="button"
              onClick={continueWithLastEmail}
              disabled={continuing}
              className="btn btn-primary w-full"
            >
              {continuing
                ? t("continuing")
                : t("continueAs", { email: lastEmail })}
            </button>
            <p className="text-center text-xs text-gray-400">
              {t("orNewAccount")}
            </p>
          </div>
        )}

        <h1 className="mb-6 text-3xl font-bold">{t("title")}</h1>

        <form
          className="mt-2 flex w-full flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleNext();
          }}
        >
          <input
            type="text"
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
          />

          <button
            type="submit"
            className={`btn mt-2 w-full ${lastEmail ? "" : "btn-primary"}`}
          >
            {t("next")}
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-gray-500">{message}</p>}
      </section>
    </main>
  );
}
