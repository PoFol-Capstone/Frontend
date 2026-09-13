import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function SignupPage() {
  const t = useTranslations("auth.signupType");

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-16">
      <section className="mx-auto flex w-full max-w-md flex-col items-center px-8 py-12">
        <h1 className="mb-6 text-3xl font-bold">{t("title")}</h1>

        <div className="mt-2 flex w-full flex-col gap-4">
          <Link
            href="/signup/email"
            className="rounded-lg border px-4 py-3 text-center text-sm font-medium hover:bg-gray-50"
          >
            {t("emailStart")}
          </Link>

          {/* TODO: 임시로 GitHub 로그인 숨김 처리 */}
          <button
            type="button"
            className="mt-2 hidden rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:opacity-90"
          >
            {t("githubLogin")}
          </button>
        </div>
      </section>
    </main>
  );
}