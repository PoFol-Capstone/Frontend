"use client";

import EmptyView from "@/app/board/_components/empty-view";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type ProfilePost = {
  id: string;
  title: string;
  thumbnailUrl?: string;
  content?: string;
  skills?: { id: number; name: string; badgeColor: string }[];
  tags?: string[];
};

const PAGE_SIZE = 4;

export default function PostCarousel({ posts }: { posts: ProfilePost[] }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(posts.length / PAGE_SIZE);
  const visible = posts.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  if (posts.length === 0) {
    return <EmptyView />;
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {visible.map((post) => (
          <Link
            key={post.id}
            href={`/board/${post.id}`}
            className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
              {post.thumbnailUrl ? (
                <Image
                  src={post.thumbnailUrl}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 280px"
                  className="object-cover transition duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-300">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/70 via-black/20 to-transparent p-3">
                <p className="text-xs font-bold leading-snug text-white drop-shadow-sm">
                  {post.title}
                </p>
                {post.skills && post.skills.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {post.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill.id}
                        className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
                      >
                        {skill.name}
                      </span>
                    ))}
                    {post.skills.length > 3 && (
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
                        +{post.skills.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-3">
              {post.content && (
                <p className="mb-2 line-clamp-2 text-[11px] leading-relaxed text-gray-500">
                  {post.content}
                </p>
              )}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
                    >
                      #{tag}
                    </span>
                  ))}
                  {post.tags.length > 3 && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-400">
                      +{post.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-400 hover:bg-gray-50 hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i).map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs transition ${
                  i === page
                    ? "bg-black font-semibold text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-black"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-400 hover:bg-gray-50 hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
