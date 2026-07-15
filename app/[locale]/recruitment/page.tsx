import { getApplicants } from "@/lib/apply";
import { getPosts } from "@/lib/post";
import { getSessionUuid } from "@/lib/session";
import { PostType } from "@/types/post";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import RecruitmentClient from "./_components/RecruitmentClient";

export default async function RecruitmentPage({
  searchParams,
}: {
  searchParams: Promise<{ postId?: string }>;
}) {
  const [{ postId }, uuid, locale] = await Promise.all([
    searchParams,
    getSessionUuid(),
    getLocale(),
  ]);

  if (!uuid) {
    redirect({ href: "/login", locale });
    return null;
  }

  const postsData = await getPosts({
    type: PostType.RECRUIT,
    authorUuid: uuid,
  });
  const posts = postsData.content;

  const selectedPostUuid = postId ?? posts[0]?.uuid;
  const applicants = selectedPostUuid
    ? await getApplicants(selectedPostUuid)
    : [];

  const t = await getTranslations("recruitment");

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-8 py-10">
      <section className="mx-auto max-w-280">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-500">
              {t("breadcrumb")}
            </p>
            <h1 className="text-[32px] font-bold tracking-[-0.03em] text-gray-950">
              {t("pageTitle")}
            </h1>
            <p className="mt-3 text-[15px] text-gray-500">
              {t("pageSubtitle")}
            </p>
          </div>
        </div>

        <RecruitmentClient
          posts={posts}
          applicants={applicants}
          selectedPostUuid={selectedPostUuid}
        />
      </section>
    </main>
  );
}
