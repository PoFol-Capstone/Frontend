"use client";

import { Link, useRouter } from "@/i18n/navigation";
import BrandLogo from "@/components/BrandLogo";
import GithubLoginButton from "@/components/GithubLoginButton";
import { sendOtp } from "@/lib/auth";
import { beginLoginFlow, readLastLoginEmail } from "@/lib/authFlow";
import { toSafeInternalPath } from "@/lib/safeRedirect";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setEmail((current) => current || readLastLoginEmail() || "");
    // GitHub 로그인 거절·실패 시 proxy · /api/auth/github/finish가 ?error=github로 돌려보낸다
    if (new URLSearchParams(window.location.search).get("error") === "github") {
      setMessage(t("githubFailed"));
    }
  }, [t]);

  const handleLogin = async () => {
    if (!email.trim()) {
      setMessage(t("emailRequired"));
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await sendOtp(email);

      // 외부 주소·javascript: 등은 저장하지 않는다 (인증 화면이 이동 직전에 한 번 더 검사한다)
      const callbackUrl = toSafeInternalPath(
        new URLSearchParams(window.location.search).get("callbackUrl"),
        window.location.origin,
      );
      beginLoginFlow(sessionStorage, email, callbackUrl);
      router.push("/signup/verify");
    } catch (error) {
      console.error(error);
      setMessage(t("failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-16">
      <section className="mx-auto flex w-full max-w-md flex-col items-center rounded-2xl px-8 py-12">
        <BrandLogo variant="symbol" className="mb-6" />
        <h1 className="mb-6 text-3xl font-bold">{t("title")}</h1>

        <form
          className="mt-4 flex w-full flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <div className="flex flex-col gap-2">
            <input
              id="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary mt-2 w-full"
          >
            {loading ? t("submitting") : t("submit")}
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-gray-500">{message}</p>}

        <div className="my-6 flex w-full items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">{t("or")}</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <GithubLoginButton label={t("githubContinue")} />

        <p className="mt-8 text-sm text-gray-500">
          {t("noAccount")}{" "}
          <Link href="/signup" className="font-medium text-black underline">
            {t("signupLink")}
          </Link>
        </p>
      </section>
    </main>
  );
}
