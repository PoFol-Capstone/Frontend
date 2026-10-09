"use client";

import { Pagination } from "@/components/Pagination";
import type { PagedResponse, ResponsePosts } from "@/types/post";
import { useTranslations } from "next-intl";
import CategoryFilter from "./CategoryFilter";
import { type Category } from "./categories";
import EmptyView from "./empty-view";
import PostCard from "./PostCard";

interface Props {
  category: Category;
  /** 학교 인증을 마친 유저인지. 아니면 학교 탭은 인증 안내를 보여준다 */
  hasSchool: boolean;
  /** 서버가 준 현재 페이지. 학교 인증 전 학교 탭처럼 조회하지 않은 경우 null */
  result: PagedResponse<ResponsePosts> | null;
}

export default function BoardClient({ category, hasSchool, result }: Props) {
  const t = useTranslations("board");
  const posts = result?.content ?? [];

  return (
    <>
      <CategoryFilter selected={category} />

      {category === "School" && !hasSchool ? (
        <EmptyView message={t("schoolVerificationRequired")} />
      ) : posts.length === 0 ? (
        <EmptyView />
      ) : (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.uuid} post={post} />
          ))}
        </section>
      )}

      {result && (
        <Pagination
          page={result.number}
          totalPages={result.totalPages}
          pathname="/board"
          query={{ category: category === "All" ? undefined : category }}
        />
      )}
    </>
  );
}
