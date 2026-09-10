"use client";

import { Pagination } from "@/components/Pagination";
import { getPosts } from "@/lib/post";
import type { ResponsePosts } from "@/types/post";
import { PostType } from "@/types/post";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import CategoryFilter, { CATEGORIES, type Category } from "./CategoryFilter";
import EmptyView from "./empty-view";
import PostCard from "./PostCard";

interface Props {
  posts: ResponsePosts[];
  /** 학교 인증을 마친 유저인지. 아니면 학교 탭은 항상 빈 목록이다 */
  hasSchool: boolean;
}

const PAGE_SIZE = 9;

function toCategory(value: string | null): Category {
  return (CATEGORIES as readonly string[]).includes(value ?? "")
    ? (value as Category)
    : "All";
}

export default function BoardClient({ posts, hasSchool }: Props) {
  const t = useTranslations("board");
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [selected, setSelected] = useState<Category>(() =>
    toCategory(categoryParam),
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [schoolPosts, setSchoolPosts] = useState<ResponsePosts[] | null>(null);

  // 다른 화면(헤더의 학교명 클릭 등)에서 ?category=School로 진입했을 때 반영.
  // 렌더링 중 상태를 조정하는 React 권장 패턴이라 useEffect 대신 이렇게 처리한다.
  const [syncedCategoryParam, setSyncedCategoryParam] = useState(categoryParam);
  if (categoryParam !== syncedCategoryParam) {
    setSyncedCategoryParam(categoryParam);
    setSelected(toCategory(categoryParam));
    setCurrentPage(0);
  }

  const handleSelect = (category: Category) => {
    setSelected(category);
    setCurrentPage(0);
  };

  useEffect(() => {
    if (selected !== "School" || !hasSchool || schoolPosts !== null) return;

    let cancelled = false;

    getPosts({ mySchoolOnly: true, page: 0, size: 1000 })
      .then((result) => {
        if (!cancelled) setSchoolPosts(result.content);
      })
      .catch(() => {
        if (!cancelled) setSchoolPosts([]);
      });

    return () => {
      cancelled = true;
    };
  }, [selected, hasSchool, schoolPosts]);

  const filtered = useMemo(() => {
    switch (selected) {
      case "All":
        return posts;
      case "Bookmarks":
        return posts.filter((p) => p.isBookmarked);
      case "Recruiting":
        return posts.filter((p) => p.postType === PostType.RECRUIT);
      case "School":
        return hasSchool ? (schoolPosts ?? []) : [];
      default:
        return posts;
    }
  }, [posts, selected, hasSchool, schoolPosts]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pagePosts = filtered.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE,
  );

  const showSchoolVerificationNotice = selected === "School" && !hasSchool;
  const showSchoolLoading =
    selected === "School" && hasSchool && schoolPosts === null;

  return (
    <>
      <CategoryFilter selected={selected} onSelect={handleSelect} />

      {showSchoolVerificationNotice ? (
        <EmptyView message={t("schoolVerificationRequired")} />
      ) : showSchoolLoading ? (
        <EmptyView message={t("schoolLoading")} />
      ) : pagePosts.length === 0 ? (
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
