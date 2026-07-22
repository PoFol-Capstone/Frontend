"use client";

import { Pagination } from "@/components/Pagination";
import type { ResponsePosts } from "@/types/post";
import { PostType } from "@/types/post";
import { useMemo, useState } from "react";
import CategoryFilter from "./CategoryFilter";
import EmptyView from "./empty-view";
import PostCard from "./PostCard";

interface Props {
  posts: ResponsePosts[];
}

const PAGE_SIZE = 9;

export default function BoardClient({ posts }: Props) {
  const [selected, setSelected] = useState("All");
  const [currentPage, setCurrentPage] = useState(0);

  const handleSelect = (category: string) => {
    setSelected(category);
    setCurrentPage(0);
  };

  const filtered = useMemo(() => {
    switch (selected) {
      case "All":
        return posts;
      case "Bookmarks":
        return posts.filter((p) => p.isBookmarked);
      case "Recruiting":
        return posts.filter((p) => p.postType === PostType.RECRUIT);
      default:
        return posts.filter((p) => p.tags.includes(selected));
    }
  }, [posts, selected]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pagePosts = filtered.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <>
      <CategoryFilter selected={selected} onSelect={handleSelect} />

      {pagePosts.length === 0 ? (
        <EmptyView />
      ) : (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pagePosts.map((post) => (
            <PostCard key={post.uuid} post={post} />
          ))}
        </section>
      )}

      <Pagination page={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
    </>
  );
}
