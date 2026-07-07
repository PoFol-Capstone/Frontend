"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ResponsePosts } from "@/types/post";

interface Props {
  post: ResponsePosts;
}

export default function PostCard({ post }: Props) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/board/${post.uuid}`)}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
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
          <p className="line-clamp-2 text-sm font-bold leading-snug text-white drop-shadow-sm">
            {post.title}
          </p>
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
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-black"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600">
              {post.authorName.slice(0, 1).toUpperCase()}
            </span>
            {post.authorName}
          </Link>
          <div className="flex items-center gap-2.5 text-[11px] text-gray-500">
            <span className="flex items-center gap-0.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {post.viewCount}
            </span>
            <span className="flex items-center gap-0.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {post.likeCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
