import EmptyView from "@/app/[locale]/board/_components/empty-view";
import { Pagination } from "@/components/Pagination";
import { PostCard } from "./PostCard";
import type { ProfilePost } from "./types";

// 2열 그리드 x 2행 = 한 페이지에 4개. 서버 page size로 그대로 쓴다
// (예전엔 10개만 받아 로컬에서 4개씩 나눠서 11번째 게시물부터 볼 수 없었다)
export const PROFILE_POSTS_PAGE_SIZE = 4;

type Props = {
  posts: ProfilePost[];
  /** 서버 응답의 현재 페이지(0부터) */
  page: number;
  totalPages: number;
  /** 페이지 링크의 기준 경로 (예: "/profile", "/profile/{uuid}") */
  pathname: string;
};

export default function PostCarousel({ posts, page, totalPages, pathname }: Props) {
  return (
    <div>
      {posts.length === 0 ? (
        <EmptyView />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} pathname={pathname} />
    </div>
  );
}
