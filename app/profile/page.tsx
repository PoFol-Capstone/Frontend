import { getSessionUuid } from "@/lib/session";
import getUser from "@/lib/user";
import { getUserPosts } from "@/lib/post";
import { redirect } from "next/navigation";
import ProfileSidebar from "./_components/ProfileSidebar";
import PostCarousel from "./_components/PostCarousel";

export default async function ProfilePage() {
  const uuid = await getSessionUuid();
  if (!uuid) redirect("/login");

  const [profile, postsResult] = await Promise.all([
    getUser(uuid),
    getUserPosts(uuid, { size: 10 }).catch(() => ({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 10,
    })),
  ]);

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
            <h2 className="mb-4 text-3xl font-bold">게시물</h2>
            <PostCarousel posts={sitePosts} />
          </section>
        </section>
      </div>
    </main>
  );
}
