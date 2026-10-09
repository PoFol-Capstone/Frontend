import { getSessionUuid } from "@/lib/session";
import getUser, { getFollowers } from "@/lib/user";
import { getUserPosts } from "@/lib/post";
import { ApiError } from "@/lib/http.server";
import { parsePageParam } from "@/lib/pagination";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import SessionExpired from "@/components/SessionExpired";
import ProfileSidebar from "./_components/ProfileSidebar";
import PostCarousel, { PROFILE_POSTS_PAGE_SIZE } from "./_components/PostCarousel";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default function ProfilePage({ searchParams }: Props) {
  // 로딩 화면은 같은 세그먼트(또는 상위)의 loading.tsx가 Suspense 경계로 보여준다.
  // 여기에 Suspense를 한 겹 더 두면, 서버 오류 뒤 error.tsx의 "다시 시도"(unstable_retry)가
  // 데이터를 다시 받아 와도 오류 화면이 남거나 React #310으로 깨졌다(Next 16.2.0 프로덕션 빌드에서 재현).
  return <ProfileContent searchParams={searchParams} />;
}

async function ProfileContent({ searchParams }: Props) {
  const locale = await getLocale();
  const uuid = await getSessionUuid();
  if (!uuid) {
    redirect({ href: "/login", locale });
    return;
  }
  const page = parsePageParam((await searchParams).page);

  // 세 요청을 병렬로 시작하되, 결과 처리는 각자 따로 (getUser 실패가 나머지를 막지 않도록)
  const profilePromise = getUser(uuid);
  // 팔로워 목록은 모달에서만 쓰므로 실패해도 페이지는 보여주되, 빈 목록이 아니라 실패로 표시한다
  const followersPromise = getFollowers(uuid).catch((err) => {
    console.error("[profile] getFollowers 실패:", err);
    return null;
  });
  const postsPromise = getUserPosts(uuid, { page, size: PROFILE_POSTS_PAGE_SIZE });
  // 아래에서 프로필 실패로 먼저 반환해도 unhandled rejection이 되지 않게 한다
  postsPromise.catch(() => {});

  let profile;
  try {
    profile = await profilePromise;
  } catch (err) {
    // 세션이 가리키는 유저가 더 이상 없거나(백엔드는 400 "존재하지 않는 유저") 인증이 거절된 경우 —
    // 복구할 수 없으므로 세션을 정리하고 재로그인시킨다. Server Component는 쿠키를 지울 수 없어서
    // Server Function을 부르는 화면으로 넘긴다. 그 외(네트워크/5xx)는 error.tsx(재시도)로 위임.
    if (
      err instanceof ApiError &&
      (err.status === 400 || err.status === 401 || err.status === 403 || err.status === 404)
    ) {
      return <SessionExpired returnTo="/profile" />;
    }
    throw err;
  }

  // 게시물 조회 실패는 "게시물 없음"으로 바꾸지 않고 error.tsx(재시도)로 보낸다
  const [postsResult, followers] = await Promise.all([
    postsPromise,
    followersPromise,
  ]);
  const t = await getTranslations("profile");

  const sitePosts = postsResult.content.map((p) => ({
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
          isOwner={true}
          followers={followers}
          viewerUuid={uuid}
        />

        <section className="space-y-12">
          <section>
            <h2 className="mb-4 text-3xl font-bold">{t("postsHeading")}</h2>
            <PostCarousel
              posts={sitePosts}
              page={postsResult.number}
              totalPages={postsResult.totalPages}
              pathname="/profile"
            />
          </section>
        </section>
      </div>
    </main>
  );
}
