"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { sendOtp } from "@/lib/auth";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    if (!email.trim()) {
      setMessage(t("emailRequired"));
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await sendOtp(email);

      sessionStorage.setItem("loginEmail", email);
      const callbackUrl =
        new URLSearchParams(window.location.search).get("callbackUrl") ??
        "/board";
      sessionStorage.setItem("callbackUrl", callbackUrl);
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
              className="rounded-lg border px-4 py-3 text-sm outline-none placeholder:text-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-black px-4 py-3 text-center text-sm font-medium text-white disabled:opacity-50"
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

        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            className="rounded-lg border px-4 py-3 text-sm font-medium"
          >
            {t("githubContinue")}
          </button>
        </div>

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
