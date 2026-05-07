"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import EmptyView from "./empty-view";
import type { ResponsePosts } from "@/types/post";

const categories = [
  "All",
  "Frontend",
  "Backend",
  "Design",
  "AI",
  "School",
  "Bookmarks",
];

interface Props {
  posts: ResponsePosts[];
  currentPage: number;
  totalPages: number;
}

export default function BoardClient({ posts, currentPage, totalPages }: Props) {
  const [selected, setSelected] = useState("All");
  const router = useRouter();

  const filtered =
    selected === "All"
      ? posts
      : posts.filter((p) => p.tags.includes(selected));

  return (
    <>
      <section className="mb-6 flex flex-wrap gap-3">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelected(category)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              selected === category
                ? "bg-black text-white"
                : "border border-gray-200 text-black hover:bg-gray-50"
            }`}
          >
            {category}
          </button>
        ))}
      </section>

      {filtered.length === 0 ? (
        <EmptyView />
      ) : (
        <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2">
          {filtered.map((post) => (
            <Link
              key={post.uuid}
              href={`/board/${post.uuid}`}
              className="w-full rounded-2xl border border-gray-200 p-4 transition hover:shadow-sm"
            >
              <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-xl bg-gray-100">
                {post.thumbnailUrl && (
                  <Image
                    src={post.thumbnailUrl}
                    alt={post.title}
                    width={600}
                    height={338}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                )}
                <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/60 via-black/10 to-transparent p-4">
                  <p className="mb-2 text-base font-bold leading-tight text-white drop-shadow">
                    {post.title}
                  </p>
                  {post.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {post.skills.slice(0, 5).map((skill) => (
                        <span
                          key={skill.id}
                          className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm"
                        >
                          {skill.name}
                        </span>
                      ))}
                      {post.skills.length > 5 && (
                        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs text-white backdrop-blur-sm">
                          +{post.skills.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <h2 className="mb-1 text-lg font-semibold">{post.title}</h2>
              <p className="mb-4 line-clamp-2 text-sm text-gray-500">
                {post.content}
              </p>

              <div className="mb-4 flex flex-wrap gap-2">
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
                <span>{post.authorName}</span>
                <span>
                  👁 {post.viewCount} / ♡ {post.likeCount}
                </span>
              </div>
            </Link>
          ))}
        </section>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => router.push(`/board?page=${currentPage - 1}`)}
            disabled={currentPage === 0}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:opacity-40"
          >
            이전
          </button>
          <span className="text-sm text-gray-500">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => router.push(`/board?page=${currentPage + 1}`)}
            disabled={currentPage >= totalPages - 1}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}
    </>
  );
}
