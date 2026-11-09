import type { ResponsePosts } from "@/types/post";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import PostCard from "./PostCard";

interface Props {
  posts: ResponsePosts[];
  selectedPostUuid: string | undefined;
  isPending: boolean;
  onToggleRecruiting: (post: ResponsePosts) => void;
}

export default function PostListSection({
  posts,
  selectedPostUuid,
  isPending,
  onToggleRecruiting,
}: Props) {
  const t = useTranslations("recruitment.postListSection");

  return (
    <section className="card">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-950">{t("title")}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("subtitle")}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {t("count", { count: posts.length })}
        </span>
      </div>

      <div className="space-y-4">
        {posts.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-200 py-12 text-center">
            <p className="text-sm text-gray-400">{t("empty")}</p>
            <Link
              href="/board/write"
              className="btn btn-primary btn-sm"
            >
              {t("write")}
            </Link>
          </div>
        )}
        {posts.map((post) => (
          <PostCard
            key={post.uuid}
            post={post}
            isSelected={post.uuid === selectedPostUuid}
            isPending={isPending}
            onToggleRecruiting={onToggleRecruiting}
          />
        ))}
      </div>
    </section>
  );
}
