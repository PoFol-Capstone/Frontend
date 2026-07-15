import type { ResponsePosts } from "@/types/post";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

type Props = {
  relatedPosts: ResponsePosts[];
};

export default function RelatedPosts({ relatedPosts }: Props) {
  return (
    <aside className="h-fit pt-1">
      <h2 className="mb-4 text-sm font-bold">관련 프로젝트</h2>

      {relatedPosts.length === 0 ? (
        <p className="text-xs text-gray-400">관련 프로젝트가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {relatedPosts.map((item) => (
            <Link
              key={item.uuid}
              href={`/board/${item.uuid}`}
              className="group flex gap-3 transition"
            >
              <div className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {item.thumbnailUrl ? (
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.title}
                    fill
                    sizes="144px"
                    className="object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center gap-1">
                <p className="text-sm font-semibold leading-5 group-hover:underline line-clamp-2">
                  {item.title}
                </p>
                {item.skills.length > 0 && (
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {item.skills.map((s) => s.name).join(" · ")}
                  </p>
                )}
                <p className="text-xs text-gray-400">{item.authorName}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </aside>
  );
}
