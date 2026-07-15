"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function SignupPage() {
  const t = useTranslations("auth.signupName");
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const handleNext = () => {
    if (!name.trim()) {
      setMessage(t("nameRequired"));
      return;
    }

    sessionStorage.setItem("signupName", name.trim());
    router.push("/signup/type");
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-16">
      <section className="mx-auto flex w-full max-w-md flex-col items-center px-8 py-12">
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
            className="w-full rounded-lg border px-4 py-3 text-sm outline-none placeholder:text-gray-400"
          />

          <button
            type="submit"
            className="mt-2 rounded-lg bg-black px-4 py-3 text-center text-sm font-medium text-white"
          >
            {t("next")}
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-gray-500">{message}</p>}
      </section>
    </main>
  );
}
