import type { ResponsePosts } from "@/types/post";
import { useTranslations } from "next-intl";
import PostCard from "./PostCard";

interface Props {
  posts: ResponsePosts[];
  selectedPostUuid: string | undefined;
}

export default function PostListSection({ posts, selectedPostUuid }: Props) {
  const t = useTranslations("recruitment.postListSection");

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-950">{t("title")}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("subtitle")}
          </p>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {t("count", { count: posts.length })}
        </span>
      </div>

      <div className="space-y-4">
        {posts.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">
            {t("empty")}
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
