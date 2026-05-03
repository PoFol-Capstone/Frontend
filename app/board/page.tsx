"use client";

import { posts } from "@/app/_data/posts";
import Link from "next/link";
import { useState } from "react";
import EmptyView from "./_components/empty-view";

const categories = [
  "All",
  "Frontend",
  "Backend",
  "Design",
  "AI",
  "School",
  "Bookmarks",
];

export default function BoardPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredPosts =
    selectedCategory === "All"
      ? posts
      : posts.filter((post) => post.category === selectedCategory);

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

      {filteredPosts.length === 0 ? (
        <EmptyView />
      ) : (
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
                <span>
                  👁 {post.viewCount} / ♡ {post.likeCount}
                </span>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
