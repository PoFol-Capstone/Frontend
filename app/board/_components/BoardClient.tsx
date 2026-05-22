"use client";

import type { ResponsePosts } from "@/types/post";
import { PostType } from "@/types/post";
import { useState } from "react";
import { useRouter } from "next/navigation";
import CategoryFilter from "./CategoryFilter";
import EmptyView from "./empty-view";
import PostCard from "./PostCard";

interface Props {
  posts: ResponsePosts[];
  currentPage: number;
  totalPages: number;
}

export default function BoardClient({ posts, currentPage, totalPages }: Props) {
  const [selected, setSelected] = useState("All");
  const [bookmarkedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("bookmarks") || "[]");
  });

  const router = useRouter();

  const filtered =
    selected === "All"
      ? posts
      : selected === "Bookmarks"
        ? posts.filter((p) => bookmarkedIds.includes(p.uuid))
        : selected === "Recruiting"
          ? posts.filter((p) => p.postType === PostType.RECRUIT)
          : posts.filter((p) => p.tags.includes(selected));

  return (
    <>
      <CategoryFilter selected={selected} onSelect={setSelected} />

      {filtered.length === 0 ? (
        <EmptyView />
      ) : (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <PostCard key={post.uuid} post={post} />
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
            <svg
              width="16"
              height="16"
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
            <svg
              width="16"
              height="16"
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
    </>
  );
}
