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
    <>
      <p className="whitespace-pre-line text-sm leading-7 text-gray-600">
        {description}
      </p>

      {features && (
        <div className="mt-6 border-t border-gray-100 pt-6">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">주요 기능</h2>
          <p className="whitespace-pre-line text-sm leading-7 text-gray-600">
            {features}
          </p>
        </div>
      )}

      {tags.length > 0 && (
        <div className="my-5 border-t border-gray-100 pt-5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {links.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {links.map((link) => (
            <a
              key={link.type}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              <span>{LINK_META[link.type].icon}</span>
              <span>{LINK_META[link.type].label}</span>
            </a>
          ))}
        </div>
      )}

      {postType === PostType.RECRUIT && recruitPositionInfos.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold">모집 포지션</h2>
          <div className="flex flex-wrap gap-2">
            {recruitPositionInfos.map((rp) => (
              <span
                key={rp.positionType}
                className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700"
              >
                {rp.positionType} ({rp.currentCount}/{rp.maxCount})
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
