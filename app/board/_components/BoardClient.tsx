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
      <section className="mb-8 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelected(category)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              selected === category
                ? "bg-black text-white"
                : "border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-black"
            }`}
          >
            {category}
          </button>
        ))}
      </section>

      {filtered.length === 0 ? (
        <EmptyView />
      ) : (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <div
              key={post.uuid}
              onClick={() => router.push(`/board/${post.uuid}`)}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
                {post.thumbnailUrl ? (
                  <Image
                    src={post.thumbnailUrl}
                    alt={post.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-300">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4">
                  <p className="text-sm font-bold leading-snug text-white drop-shadow-sm">
                    {post.title}
                  </p>
                  {post.skills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {post.skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill.id}
                          className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm"
                        >
                          {skill.name}
                        </span>
                      ))}
                      {post.skills.length > 4 && (
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] text-white backdrop-blur-sm">
                          +{post.skills.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4">
                <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-gray-500">
                  {post.content}
                </p>

                {post.tags.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] text-gray-600"
                      >
                        #{tag}
                      </span>
                    ))}
                    {post.tags.length > 3 && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] text-gray-400">
                        +{post.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <Link
                    href={`/profile/${post.authorUuid}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-black"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600">
                      {post.authorName.slice(0, 1).toUpperCase()}
                    </span>
                    {post.authorName}
                  </Link>
                  <div className="flex items-center gap-2.5 text-[11px] text-gray-400">
                    <span className="flex items-center gap-0.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      {post.viewCount}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      {post.likeCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/board?page=${currentPage - 1}`)}
            disabled={currentPage === 0}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-400 hover:bg-gray-50 hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => router.push(`/board?page=${page}`)}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition ${
                  page === currentPage
                    ? "bg-black font-semibold text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-black"
                }`}
              >
                {page + 1}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => router.push(`/board?page=${currentPage + 1}`)}
            disabled={currentPage >= totalPages - 1}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-400 hover:bg-gray-50 hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
