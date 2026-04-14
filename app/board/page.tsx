"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/session";

const categories = [
  "All",
  "Frontend",
  "Backend",
  "Design",
  "AI",
  "School",
  "Bookmarks",
];

const posts = [
  {
    id: 1,
    title: "감정 일기장",
    description: "감정 일기장 어쩌고",
    tags: ["Next.js", "React", "Firebase"],
    category: "Frontend",
    author: "HotaeHwang",
  },
  {
    id: 2,
    title: "채팅 어플리케이션",
    description: "실시간 채팅 가능",
    tags: ["React", "Next.js", "Firebase"],
    category: "Backend",
    author: "HotaeHwang",
  },
  {
    id: 3,
    title: "디자인 시스템",
    description: "컴포넌트 구조 정리",
    tags: ["Figma", "Design"],
    category: "Design",
    author: "HotaeHwang",
  },
];

export default function BoardPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/signup");
      return;
    }

    setChecked(true);
  }, [router]);

  const filteredPosts =
    selectedCategory === "All"
      ? posts
      : posts.filter((post) => post.category === selectedCategory);

  if (!checked) {
    return <div className="p-6">확인 중...</div>;
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-6">
      <section className="mb-6 flex flex-wrap gap-3">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              selectedCategory === category
                ? "bg-black text-white"
                : "border border-gray-200 text-black hover:bg-gray-50"
            }`}
          >
            {category}
          </button>
        ))}
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2">
        {filteredPosts.map((post) => (
          <Link
            key={post.id}
            href={`/board/${post.id}`}
            className="w-full rounded-2xl border border-gray-200 p-4 transition hover:shadow-sm"
          >
            <div className="mb-4 aspect-video w-full rounded-xl bg-gray-100" />

            <h2 className="mb-1 text-lg font-semibold">{post.title}</h2>
            <p className="mb-4 text-sm text-gray-500">{post.description}</p>

            <div className="mb-5 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-xs text-gray-500">
              <span>{post.author}</span>
              <span>조회수 / 좋아요</span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}