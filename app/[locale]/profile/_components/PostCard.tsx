import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { BadgeList } from "./BadgeList";
import type { ProfilePost } from "./types";

// 그리드 컬럼 폭(모바일 50vw, 데스크탑 2열 기준 최대 280px)에 맞춘 값
const THUMBNAIL_SIZES = "(max-width: 768px) 50vw, 280px";

export function PostCard({ post }: { post: ProfilePost }) {
  const skillBadges = (post.skills ?? []).map((skill) => ({
    key: String(skill.id),
    label: skill.name,
  }));
  const tagBadges = (post.tags ?? []).map((tag) => ({
    key: tag,
    label: `#${tag}`,
  }));

  return (
    <Link
      href={`/board/${post.id}`}
      className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        {post.thumbnailUrl ? (
          <Image
            src={post.thumbnailUrl}
            alt={post.title}
            fill
            sizes={THUMBNAIL_SIZES}
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            unoptimized
          />
        ) : (
          <ThumbnailPlaceholder />
        )}
        <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/70 via-black/20 to-transparent p-3">
          <p className="text-xs font-bold leading-snug text-white drop-shadow-sm">{post.title}</p>
          <BadgeList
            items={skillBadges}
            badgeClassName="mt-1.5 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
          />
        </div>
      </div>

      <div className="p-3">
        {post.content && (
          <p className="mb-2 line-clamp-2 text-[11px] leading-relaxed text-gray-500">{post.content}</p>
        )}
        <BadgeList
          items={tagBadges}
          badgeClassName="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
        />
      </div>
    </Link>
  );
}

function ThumbnailPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center text-gray-300">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    </div>
  );
}
