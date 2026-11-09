import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getSessionUuid } from "@/lib/session";
import { redirect } from "@/i18n/navigation";
import { getResume } from "@/lib/resume";
import getUser from "@/lib/user";
import ResumeEditor from "../_components/ResumeEditor";

type Props = { params: Promise<{ id: string }> };

export default async function ResumeDetailPage({ params }: Props) {
  const [{ id }, locale, uuid] = await Promise.all([params, getLocale(), getSessionUuid()]);
  if (!uuid) {
    redirect({ href: "/login", locale });
    return;
  }

  const [resume, profile] = await Promise.all([getResume(id), getUser(uuid)]);
  if (!resume.ok) {
    // 없는 이력서와 남의 이력서는 백엔드가 같은 404로 숨긴다
    if (resume.status === 404 || resume.status === 400) notFound();
    throw new Error(resume.error);
  }

  return <ResumeEditor initial={resume.data} profile={profile} />;
}
