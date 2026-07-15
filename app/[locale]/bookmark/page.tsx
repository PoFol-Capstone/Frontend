"use client";

import { getPosts } from "@/lib/post";
import type { ResponsePosts } from "@/types/post";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function BookmarkPage() {
  const t = useTranslations("bookmark");
  const [bookmarkedPosts, setBookmarkedPosts] = useState<ResponsePosts[]>([]);

  useEffect(() => {
    const loadBookmarks = async () => {
      const savedBookmarks: string[] = JSON.parse(
        localStorage.getItem("bookmarks") || "[]",
      );

      const response = await getPosts();

      const filteredPosts = response.content.filter((post: ResponsePosts) =>
        savedBookmarks.includes(post.uuid)
      );
      console.log(filteredPosts);

      setBookmarkedPosts(filteredPosts);
    };

    loadBookmarks();
  }, []);

  return (
    <main className="min-h-screen bg-white px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>

      {bookmarkedPosts.length === 0 ? (
        <p className="text-gray-400">{t("empty")}</p>
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
