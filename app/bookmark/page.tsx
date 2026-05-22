"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPosts } from "@/lib/post";
import type { ResponsePosts } from "@/types/post";

export default function BookmarkPage() {
  const [bookmarkedPosts, setBookmarkedPosts] = useState<ResponsePosts[]>([]);

  useEffect(() => {
    const loadBookmarks = async () => {
      const savedBookmarks: string[] = JSON.parse(
        localStorage.getItem("bookmarks") || "[]"
      );

      const response = await getPosts();

      const filteredPosts = response.content.filter((post: ResponsePosts) =>
        savedBookmarks.includes(post.uuid)
      );

      setBookmarkedPosts(filteredPosts);
    };

    loadBookmarks();
  }, []);

  return (
    <main className="min-h-screen bg-white px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">북마크</h1>

      {bookmarkedPosts.length === 0 ? (
        <p className="text-gray-400">북마크한 게시글이 없습니다.</p>
      ) : (
        <div className="grid gap-4">
          {bookmarkedPosts.map((post) => (
            <Link
              key={post.uuid}
              href={`/board/${post.uuid}`}
              className="rounded-xl border border-gray-200 p-5 transition hover:border-black"
            >
              <h2 className="text-lg font-semibold">{post.title}</h2>
              <p className="mt-2 text-sm text-gray-500">{post.content}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}