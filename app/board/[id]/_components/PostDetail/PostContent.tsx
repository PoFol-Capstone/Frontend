import type { PostLink, RecruitPositionResponse } from "@/types/post";
import { LinkType, PostType } from "@/types/post";

const LINK_META: Record<LinkType, { label: string; icon: string }> = {
  [LinkType.GITHUB]: { label: "GitHub", icon: "⌥" },
  [LinkType.DEPLOY]: { label: "배포 사이트", icon: "↗" },
  [LinkType.FIGMA]: { label: "Figma", icon: "▣" },
  [LinkType.ERD]: { label: "ERD", icon: "⊞" },
  [LinkType.CLASS]: { label: "클래스 다이어그램", icon: "⊟" },
  [LinkType.EXTRA]: { label: "추가 자료", icon: "+" },
};

type Props = {
  content: string;
  tags: string[];
  links: PostLink[];
  postType: PostType;
  recruitPositionInfos: RecruitPositionResponse[];
};

export default function PostContent({
  content,
  tags,
  links,
  postType,
  recruitPositionInfos,
}: Props) {
  const [description, features] = content.split("\n\n## 주요 기능\n");

  return (
    <div className="space-y-8">
      <section>
        <p className="whitespace-pre-line text-[15px] leading-7 text-gray-700">
          {description}
        </p>

        {features && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <h2 className="mb-3 text-base font-semibold text-gray-900">
              주요 기능
            </h2>
            <p className="whitespace-pre-line text-[15px] leading-7 text-gray-700">
              {features}
            </p>
          </div>
        )}
      </section>

      {tags.length > 0 && (
        <section className="flex flex-wrap gap-2 border-t border-gray-100 pt-6">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
            >
              #{tag}
            </span>
          ))}
        </section>
      )}

      {links.length > 0 && (
        <section className="flex flex-wrap gap-2">
          {links.map((link) => (
            <a
              key={link.type}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
            >
              <span>{LINK_META[link.type].icon}</span>
              <span>{LINK_META[link.type].label}</span>
            </a>
          ))}
        </section>
      )}

      {postType === PostType.RECRUIT && recruitPositionInfos.length > 0 && (
        <section className="rounded-2xl bg-gray-50 p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            모집 포지션
          </h2>
          <div className="flex flex-wrap gap-2">
            {recruitPositionInfos.map((rp) => (
              <span
                key={rp.positionType}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100"
              >
                {rp.positionType}
                <span className="text-emerald-500">
                  {rp.currentCount}/{rp.maxCount}
                </span>
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
