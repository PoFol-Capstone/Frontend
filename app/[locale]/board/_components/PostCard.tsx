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

  // 카드 전체를 클릭 영역으로 쓰되 실제 링크는 제목 하나다(::after가 카드를 덮는다).
  // 예전엔 onClick만 있는 div라 키보드로 열 수 없었고, 작성자 링크를 카드 링크 안에
  // 중첩하지 않도록 작성자 링크는 z-10으로 덮개 위에 올린다.
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition focus-within:ring-2 focus-within:ring-black hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-gray-100">
        {post.thumbnailUrl ? (
          <Image
            src={post.thumbnailUrl}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/70 via-black/20 to-transparent p-4">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-white drop-shadow-sm">
            <Link
              href={href}
              onClick={(e) => handleLinkClick(e, href)}
              className="outline-none after:absolute after:inset-0 after:content-['']"
            >
              {post.title}
            </Link>
          </h3>
          {post.skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {post.skills.slice(0, 4).map((skill) => (
                <span
                  key={skill.id}
                  className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm"
                >
                  {skill.name}
                </span>
              ))}
              {post.skills.length > 4 && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] text-white backdrop-blur-sm">
                  +{post.skills.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pt-4">
        <p className="mb-3 line-clamp-2 flex-1 text-xs leading-relaxed text-gray-500">
          {post.content}
        </p>

        {post.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] text-gray-600"
              >
                #{tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] text-gray-500">
                +{post.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex h-9 items-center justify-between border-t border-gray-100">
          <Link
            href={`/profile/${post.authorUuid}`}
            className="relative z-10 flex items-center gap-1.5 text-xs text-gray-500 hover:text-black"
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
    </article>
  );
}
