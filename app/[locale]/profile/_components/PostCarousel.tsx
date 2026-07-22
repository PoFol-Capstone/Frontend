"use client";

import EmptyView from "@/app/[locale]/board/_components/empty-view";
import { Pagination } from "@/components/Pagination";
import { useState } from "react";
import { PostCard } from "./PostCard";
import type { ProfilePost } from "./types";

// 2열 그리드 x 2행 = 한 페이지에 4개씩 보여주기 위한 값
const PAGE_SIZE = 4;

export default function PostCarousel({ posts }: { posts: ProfilePost[] }) {
  const [page, setPage] = useState(0);

  if (posts.length === 0) {
    return <EmptyView />;
  }

  const totalPages = Math.ceil(posts.length / PAGE_SIZE);
  const visiblePosts = posts.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {visiblePosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
