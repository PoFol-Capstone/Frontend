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
            className="btn btn-secondary w-full"
          >
            {t("emailStart")}
          </Link>

          {/* TODO: 임시로 GitHub 로그인 숨김 처리 */}
          <button
            type="button"
            className="mt-2 hidden h-12 rounded-xl bg-black px-4 text-[15px] font-semibold text-white hover:opacity-90"
          >
            {t("githubLogin")}
          </button>
        </div>
      </section>
    </main>
  );
}