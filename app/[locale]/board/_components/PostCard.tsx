"use client";

import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/Avatar";
import { Eye, Heart } from "lucide-react";
import Image from "next/image";
import { useNavigation } from "@/components/NavigationProvider";
import type { ResponsePosts } from "@/types/post";

interface Props {
  post: ResponsePosts;
}

export default function PostCard({ post }: Props) {
  const { handleLinkClick } = useNavigation();
  const href = `/board/${post.uuid}`;

  // 카드 전체를 덮는 링크 하나를 article 직속 마지막 자식으로 둔다.
  // 작성자 링크는 z-10으로 덮개 위에 올린다.
  // 격자 선은 부모가 border-l/t, 각 셀이 border-r/b를 맡아 1px로 공유한다.
  return (
    <article className="group relative flex flex-col border-r border-b border-gray-900 bg-white transition-colors hover:bg-gray-50 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-black">
      <div className="relative aspect-video w-full shrink-0 overflow-hidden border-b border-gray-900 bg-gray-100">
        {post.thumbnailUrl ? (
          <Image
            src={post.thumbnailUrl}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex-1 pb-5">
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-gray-900">
            {post.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500">
            {post.content}
          </p>

          {post.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1">
              {post.skills.slice(0, 4).map((skill) => (
                <span
                  key={skill.id}
                  className="border border-gray-300 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-700"
                >
                  {skill.name}
                </span>
              ))}
              {post.skills.length > 4 && (
                <span className="border border-gray-300 px-1.5 py-0.5 text-[11px] text-gray-500">
                  +{post.skills.length - 4}
                </span>
              )}
            </div>
          )}

          {post.tags.length > 0 && (
            <p className="mt-3 flex flex-wrap gap-x-2 text-[11px] text-gray-500">
              {post.tags.slice(0, 3).map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
              {post.tags.length > 3 && <span>+{post.tags.length - 3}</span>}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 pt-3">
          <Link
            href={`/profile/${post.authorUuid}`}
            className="relative z-10 flex items-center gap-1.5 text-xs text-gray-600 hover:text-black hover:underline"
          >
            <Avatar src={null} name={post.authorName} size="xs" />
            {post.authorName}
          </Link>
          <div className="flex items-center gap-2.5 text-[11px] text-gray-500">
            <span className="flex items-center gap-0.5">
              <Eye className="h-3 w-3" />
              {post.viewCount}
            </span>
            <span className="flex items-center gap-0.5">
              <Heart className="h-3 w-3" />
              {post.likeCount}
            </span>
          </div>
        </div>
      </div>

      <Link
        href={href}
        onClick={(e) => handleLinkClick(e, href)}
        aria-label={post.title}
        className="absolute inset-0 z-1 outline-none"
      />
    </article>
  );
}
