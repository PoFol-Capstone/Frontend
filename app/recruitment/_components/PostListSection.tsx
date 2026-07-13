import type { ResponsePosts } from "@/types/post";
import PostCard from "./PostCard";

interface Props {
  posts: ResponsePosts[];
  selectedPostUuid: string | undefined;
}

export default function PostListSection({ posts, selectedPostUuid }: Props) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-950">내 모집글</h2>
          <p className="mt-1 text-sm text-gray-500">
            현재 등록한 팀원 모집 게시글이에요.
          </p>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {posts.length}개
        </span>
      </div>

      <div className="space-y-4">
        {posts.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">
            등록한 모집글이 없어요.
          </p>
        )}
        {posts.map((post) => (
          <PostCard
            key={post.uuid}
            post={post}
            isSelected={post.uuid === selectedPostUuid}
          />
        ))}
      </div>
    </section>
  );
}
