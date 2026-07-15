import { getSessionUuid, clearSession } from "@/lib/session";
import getUser from "@/lib/user";
import { getUserPosts } from "@/lib/post";
import { ApiError } from "@/lib/http.server";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import ProfileSidebar from "./_components/ProfileSidebar";
import PostCarousel from "./_components/PostCarousel";

export default async function ProfilePage() {
  const locale = await getLocale();
  const uuid = await getSessionUuid();
  if (!uuid) {
    redirect({ href: "/login", locale });
    return;
  }

  // 두 요청을 병렬로 시작하되, 결과 처리는 각자 따로 (getUser 실패가 getUserPosts를 막지 않도록)
  const profilePromise = getUser(uuid);
  const postsPromise = getUserPosts(uuid, { size: 10 }).catch((err) => {
    const message = err instanceof ApiError ? err.message : err?.message;
    const status = err instanceof ApiError ? err.status : err?.response?.status;
    console.error("[profile] getUserPosts 실패:", status, message);
    return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 };
  });

  let profile;
  try {
    profile = await profilePromise;
  } catch (err) {
    // 세션이 가리키는 유저가 더 이상 없거나(404) 인증이 만료된 경우(401/403) —
    // 복구 불가능하므로 세션을 지우고 재로그인 유도. 그 외(네트워크/5xx)는 error.tsx로 위임.
    if (
      err instanceof ApiError &&
      (err.status === 401 || err.status === 403 || err.status === 404)
    ) {
      await clearSession();
      redirect({ href: "/login", locale });
    }
    throw err;
  }

  const postsResult = await postsPromise;
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
        <ProfileSidebar profile={profile} isOwner={true} />

        <section className="space-y-12">
          <section>
            <h2 className="mb-4 text-3xl font-bold">{t("postsHeading")}</h2>
            <PostCarousel posts={sitePosts} />
          </section>
        </section>
      </div>
    </main>
  );
}
