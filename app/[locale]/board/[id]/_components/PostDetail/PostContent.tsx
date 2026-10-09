"use client";

import type { PostLink, RecruitPositionResponse } from "@/types/post";
import { LinkType, PostType } from "@/types/post";
import { getRecruitNoteDisplay, splitPostContent } from "@/lib/postContent";
import { useTranslations } from "next-intl";

const LINK_ICON: Record<LinkType, string> = {
  [LinkType.GITHUB]: "⌥",
  [LinkType.DEPLOY]: "↗",
  [LinkType.FIGMA]: "▣",
  [LinkType.ERD]: "⊞",
  [LinkType.CLASS]: "⊟",
  [LinkType.EXTRA]: "+",
};

const LINK_LABEL_KEYS: Record<LinkType, string> = {
  [LinkType.GITHUB]: "linkGithub",
  [LinkType.DEPLOY]: "linkDeploy",
  [LinkType.FIGMA]: "linkFigma",
  [LinkType.ERD]: "linkErd",
  [LinkType.CLASS]: "linkClass",
  [LinkType.EXTRA]: "linkExtra",
};

type Props = {
  content: string;
  /** 모집 조건 (RECRUIT 글 작성 시 "모집 설명"으로 입력한 값) */
  recruitNote?: string | null;
  tags: string[];
  links: PostLink[];
  postType: PostType;
  recruitPositionInfos: RecruitPositionResponse[];
};

export default function PostContent({
  content,
  recruitNote,
  tags,
  links,
  postType,
  recruitPositionInfos,
}: Props) {
  const t = useTranslations("board.detail");
  // 첫 구분자에서만 나눈다 — 구분자가 여러 번 있어도 뒤쪽 내용이 사라지지 않는다
  const { description, features } = splitPostContent(content);
  const { note, showContent } = getRecruitNoteDisplay(content, recruitNote, postType);
  const isRecruit = postType === PostType.RECRUIT;

  return (
    <div className="space-y-8">
      {showContent && (
        <section>
          <p className="whitespace-pre-line text-[15px] leading-7 text-gray-700">
            {description}
          </p>

          {features && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <h2 className="mb-3 text-base font-semibold text-gray-900">
                {t("mainFeatures")}
              </h2>
              <p className="whitespace-pre-line text-[15px] leading-7 text-gray-700">
                {features}
              </p>
            </div>
          )}
        </section>
      )}

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
              <span>{LINK_ICON[link.type]}</span>
              <span>{t(LINK_LABEL_KEYS[link.type])}</span>
            </a>
          ))}
        </section>
      )}

      {isRecruit && (note || recruitPositionInfos.length > 0) && (
        <section className="space-y-5 rounded-2xl bg-gray-50 p-5">
          {/* 작성 화면에서 받은 모집 조건 — 예전엔 저장만 되고 상세에서 보이지 않았다 */}
          {note && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-gray-900">
                {t("recruitNote")}
              </h2>
              <p className="whitespace-pre-line text-[15px] leading-7 text-gray-700">
                {note}
              </p>
            </div>
          )}

          {recruitPositionInfos.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-gray-900">
                {t("recruitPositions")}
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
            </div>
          )}
        </section>
      )}
    </div>
  );
}
