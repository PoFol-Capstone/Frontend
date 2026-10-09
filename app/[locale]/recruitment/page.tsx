import SessionExpired from "@/components/SessionExpired";
import { getApplicants, getMyRecruitPosts } from "@/lib/apply";
import { isSessionRejected } from "@/lib/http.server";
import { getSessionUuid } from "@/lib/session";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import RecruitmentClient from "./_components/RecruitmentClient";

type Props = {
  searchParams: Promise<{ postId?: string }>;
};

export default function RecruitmentPage({ searchParams }: Props) {
  // 로딩 화면은 같은 세그먼트(또는 상위)의 loading.tsx가 Suspense 경계로 보여준다.
  // 여기에 Suspense를 한 겹 더 두면, 서버 오류 뒤 error.tsx의 "다시 시도"(unstable_retry)가
  // 데이터를 다시 받아 와도 오류 화면이 남거나 React #310으로 깨졌다(Next 16.2.0 프로덕션 빌드에서 재현).
  return <RecruitmentContent searchParams={searchParams} />;
}

async function loadRecruitment(postId: string | undefined) {
  const posts = await getMyRecruitPosts();
  // 쿼리의 postId는 내 모집글일 때만 쓴다 (남의 글이면 지원자 조회가 거절된다)
  const selectedPostUuid = posts.some((p) => p.uuid === postId)
    ? postId
    : posts[0]?.uuid;
  const applicants = selectedPostUuid ? await getApplicants(selectedPostUuid) : [];
  return { posts, applicants, selectedPostUuid };
}

async function RecruitmentContent({ searchParams }: Props) {
  const [{ postId }, uuid, locale] = await Promise.all([
    searchParams,
    getSessionUuid(),
    getLocale(),
  ]);

  if (!uuid) {
    redirect({ href: "/login", locale });
    return null;
  }

  // 실패는 빈 목록으로 바꾸지 않는다 — 거절된 세션은 재로그인, 그 외는 recruitment/error.tsx(재시도)
  let data: Awaited<ReturnType<typeof loadRecruitment>>;
  try {
    data = await loadRecruitment(postId);
  } catch (error) {
    if (isSessionRejected(error)) {
      const returnTo = postId
        ? `/recruitment?postId=${encodeURIComponent(postId)}`
        : "/recruitment";
      return <SessionExpired returnTo={returnTo} />;
    }
    throw error;
  }

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
          posts={data.posts}
          applicants={data.applicants}
          selectedPostUuid={data.selectedPostUuid}
        />
      </section>
    </main>
  );
}
