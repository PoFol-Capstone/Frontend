import { getSessionUuid } from "@/lib/session";
import getUser from "@/lib/user";
import { redirect } from "next/navigation";
import ProfileSidebar from "./_components/ProfileSidebar";
import PostCarousel from "./_components/PostCarousel";

// TODO: 추후 API로 대체
const sitePosts = [
  { id: "1", title: "감정 일기장" },
  { id: "2", title: "채팅 어플리케이션" },
  { id: "3", title: "디자인 시스템" },
  { id: "4", title: "AI 추천 서비스" },
];

const backendPosts = [
  { title: "ERD", description: "데이터베이스 엔티티 관계도", tag: "Database" },
  { title: "피그마 구조도", description: "서비스 플로우 및 화면 구조", tag: "Flow" },
  { title: "클래스 다이어그램", description: "객체 지향 설계 다이어그램", tag: "UML" },
];

const works = [
  {
    title: "PoFol",
    period: "2026.02 ~ 2026.03",
    description: "포트폴리오를 자동으로 정리하고 공유할 수 있도록 하기 위해 개발했습니다.",
    details: [
      "사용자가 프로젝트를 등록하고, 팀원을 모집할 수 있는 플랫폼입니다.",
      "GitHub 연동 자동 등록",
      "팀원 모집 및 지원 기능",
      "기술 스택 기반 검색",
    ],
    tags: ["Next.js", "React", "Firebase"],
  },
];

export default async function ProfilePage() {
  const uuid = await getSessionUuid();
  if (!uuid) redirect("/login");

  const profile = await getUser(uuid);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-10 py-8">
      <div className="mx-auto grid max-w-6xl grid-cols-[300px_1fr] gap-12">
        <ProfileSidebar profile={profile} />

        <section className="space-y-12">
          <section>
            <h2 className="mb-4 text-3xl font-bold">사이트 게시물</h2>
            <PostCarousel posts={sitePosts} />
          </section>

          <section className="border-t border-gray-300 pt-5">
            <h2 className="mb-4 text-3xl font-bold">백엔드 게시물</h2>
            <div className="grid grid-cols-3 gap-4">
              {backendPosts.map((post) => (
                <div
                  key={post.title}
                  className="rounded-2xl border border-gray-300 p-4"
                >
                  <div className="mb-4 aspect-video rounded-xl bg-gray-200" />
                  <h3 className="font-bold">{post.title}</h3>
                  <p className="mt-2 text-sm text-gray-500">{post.description}</p>
                  <span className="mt-4 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs">
                    {post.tag}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-3xl font-bold">작업 이력</h2>
            <div className="space-y-5">
              {works.map((work) => (
                <article
                  key={work.title}
                  className="rounded-2xl border border-gray-300 p-6"
                >
                  <h3 className="text-xl font-bold">{work.title}</h3>
                  <p className="mt-3 text-sm text-gray-500">{work.period}</p>
                  <p className="mt-4 text-sm font-medium leading-6">{work.description}</p>
                  <div className="mt-4 space-y-1 text-sm">
                    {work.details.map((detail) => (
                      <p key={detail}>✓ {detail}</p>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {work.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
