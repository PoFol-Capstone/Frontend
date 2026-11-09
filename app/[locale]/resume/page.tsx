import { getLocale, getTranslations } from "next-intl/server";
import { getSessionUuid } from "@/lib/session";
import { redirect, Link } from "@/i18n/navigation";
import { listResumes } from "@/lib/resume";
import ResumeSurveyForm from "./_components/ResumeSurveyForm";

/** 3.7 AI 이력서 — 내 이력서 목록 + 새 이력서(설문 → AI 초안) */
export default async function ResumePage() {
  const locale = await getLocale();
  if (!(await getSessionUuid())) {
    redirect({ href: "/login", locale });
    return;
  }
  const t = await getTranslations("resume");
  const resumes = await listResumes();

  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold">{t("heading")}</h1>
        <p className="mt-2 text-sm text-gray-500">{t("desc")}</p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("listHeading")}</h2>
        {!resumes.ok ? (
          <p role="alert" className="text-sm text-red-500">{t("loadFailed")}</p>
        ) : resumes.data.length === 0 ? (
          <p className="text-sm text-gray-500">{t("listEmpty")}</p>
        ) : (
          <ul className="divide-y divide-gray-200 rounded-2xl border border-gray-200">
            {resumes.data.map((r) => (
              <li key={r.uuid}>
                <Link href={`/resume/${r.uuid}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
                  <span className="font-medium">{r.title}</span>
                  <span className="text-xs text-gray-400">{new Date(r.updatedAt).toLocaleDateString(locale)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ResumeSurveyForm />
    </main>
  );
}
