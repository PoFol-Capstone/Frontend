"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { sendOtp } from "@/lib/auth";
import { useTranslations } from "next-intl";

export default function SignupEmailPage() {
  const t = useTranslations("auth.signupEmail");
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
      setMessage(t("emailRequired"));
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await sendOtp(email);

      sessionStorage.setItem("signupEmail", email);
      sessionStorage.setItem("toastMessage", t("otpSentToast"));

      router.push("/signup/verify");
    } catch (error) {
      console.error(error);
      setMessage(t("sendFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-16">
      <section className="mx-auto flex w-full max-w-md flex-col items-center rounded-2xl px-8 py-12">
        <h1 className="mb-6 text-3xl font-bold">{t("title")}</h1>

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
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border px-4 py-3 text-sm outline-none placeholder:text-gray-400"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-black px-4 py-3 text-center text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? t("sending") : t("submit")}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-red-500">{message}</p>
        )}

        <p className="mt-8 text-sm text-gray-500">
          <Link
            href="/signup/type"
            className="font-medium text-gray-500 underline"
          >
            {t("otherOption")}
          </Link>
        </p>

        <p className="mt-8 text-sm text-gray-500">
          {t("schoolEmailHint")}
        </p>
      </section>
    </main>
  );
}