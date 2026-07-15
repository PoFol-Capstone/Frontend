import { getSessionUuid } from "@/lib/session";
import getUser, { getFollowers } from "@/lib/user";
import { getUserPosts } from "@/lib/post";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import ProfileSidebar from "../_components/ProfileSidebar";
import PostCarousel from "../_components/PostCarousel";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params;

  const [sessionUuid, profile] = await Promise.all([
    getSessionUuid(),
    getUser(id).catch(() => null),
  ]);

  if (!profile) notFound();
  if (sessionUuid === id)
    redirect({ href: "/profile", locale: await getLocale() });

  const isOwner = sessionUuid === profile.uuid;

  const [followers, postsResult] = await Promise.all([
    getFollowers(profile.uuid).catch(() => []),
    getUserPosts(id, { size: 10 }).catch((err) => {
      console.error("[profile/id] getUserPosts 실패:", err?.response?.status, err?.message,);
      return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 };
    }),
  ]);

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
        />

        <section className="space-y-12">
          <section>
            <h2 className="mb-4 text-3xl font-bold">게시물</h2>
            <PostCarousel posts={carouselPosts} />
          </section>
        </section>
      </div>
    </main>
  );
}