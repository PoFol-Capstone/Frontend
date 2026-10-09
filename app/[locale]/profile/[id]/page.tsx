import { getSessionUuid } from "@/lib/session";
import getUser, { getFollowers } from "@/lib/user";
import { getUserPosts } from "@/lib/post";
import { ApiError } from "@/lib/http.server";
import { parsePageParam } from "@/lib/pagination";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import ProfileSidebar from "../_components/ProfileSidebar";
import PostCarousel, { PROFILE_POSTS_PAGE_SIZE } from "../_components/PostCarousel";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default function UserProfilePage({ params, searchParams }: Props) {
  // 로딩 화면은 같은 세그먼트(또는 상위)의 loading.tsx가 Suspense 경계로 보여준다.
  // 여기에 Suspense를 한 겹 더 두면, 서버 오류 뒤 error.tsx의 "다시 시도"(unstable_retry)가
  // 데이터를 다시 받아 와도 오류 화면이 남거나 React #310으로 깨졌다(Next 16.2.0 프로덕션 빌드에서 재현).
  return <UserProfileContent params={params} searchParams={searchParams} />;
}

async function loadProfile(id: string) {
  try {
    return await getUser(id);
  } catch (err) {
    // 백엔드는 없는 유저·잘못된 uuid를 400(또는 404)으로 거절한다 — 이것만 404 화면으로 보낸다.
    // 예전엔 서버 장애·인증 오류까지 전부 null → 404로 바꿔서 장애가 "없는 사용자"로 보였다.
    if (err instanceof ApiError && (err.status === 400 || err.status === 404)) {
      return null;
    }
    throw err;
  }
}

async function UserProfileContent({ params, searchParams }: Props) {
  const [{ id }, { page: pageParam }] = await Promise.all([params, searchParams]);
  const page = parsePageParam(pageParam);

  const [sessionUuid, profile] = await Promise.all([
    getSessionUuid(),
    loadProfile(id),
  ]);

  if (!profile) notFound();
  if (sessionUuid === id)
    redirect({ href: "/profile", locale: await getLocale() });

  const isOwner = sessionUuid === profile.uuid;

  const [followers, postsResult] = await Promise.all([
    // 팔로워 목록은 모달에서만 쓰므로 실패해도 페이지는 보여주되, 빈 목록이 아니라 실패로 표시한다
    getFollowers(profile.uuid).catch((err) => {
      console.error("[profile/id] getFollowers 실패:", err);
      return null;
    }),
    // 게시물 조회 실패는 "게시물 없음"으로 바꾸지 않고 error.tsx(재시도)로 보낸다
    getUserPosts(id, { page, size: PROFILE_POSTS_PAGE_SIZE }),
  ]);

  const t = await getTranslations("profile");

  const carouselPosts = postsResult.content.map((p) => ({
    id: p.uuid,
    title: p.title,
    thumbnailUrl: p.thumbnailUrl,
    content: p.content,
    skills: p.skills,
    tags: p.tags,
  }));

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-10 py-8">
      <div className="mx-auto grid max-w-6xl grid-cols-[300px_1fr] gap-12">
        <ProfileSidebar
          profile={profile}
          isOwner={isOwner}
          followers={followers}
          viewerUuid={sessionUuid}
        />

        <section className="space-y-12">
          <section>
            <h2 className="mb-4 text-3xl font-bold">{t("postsHeading")}</h2>
            <PostCarousel
              posts={carouselPosts}
              page={postsResult.number}
              totalPages={postsResult.totalPages}
              pathname={`/profile/${id}`}
            />
          </section>
        </section>
      </div>
    </main>
  );
}
