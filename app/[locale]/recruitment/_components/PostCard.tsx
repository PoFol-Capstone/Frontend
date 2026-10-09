"use client";

import type { ResponsePosts } from "@/types/post";
import { Link } from "@/i18n/navigation";
import { useNavigation } from "@/components/NavigationProvider";
import { useTranslations } from "next-intl";
import { deriveStatus } from "./utils";

interface Props {
  post: ResponsePosts;
  isSelected: boolean;
}

/** 모집글 수정은 게시글 수정 화면을 쓴다 (예전 /recruitment/edit/{uuid}는 없는 경로라 404였다) */
export function recruitmentEditHref(postUuid: string) {
  return `/board/${postUuid}/edit`;
}

export default function PostCard({ post, isSelected }: Props) {
  const t = useTranslations("recruitment.postCard");
  const tStatus = useTranslations("recruitment.status");
  const { handleLinkClick } = useNavigation();
  const status = deriveStatus(post);
  const statusLabel =
    status === "CLOSED" ? tStatus("closed") : tStatus("recruiting");
  const selectHref = `/recruitment?postId=${post.uuid}`;
  const editHref = recruitmentEditHref(post.uuid);

  // 카드 전체가 "이 글 선택" 영역이지만 실제 링크는 제목 하나다(::after가 카드를 덮는다).
  // 예전엔 onClick만 있는 article이라 키보드로 선택할 수 없었고, 수정 버튼이 그 안에 중첩돼 있었다.
  return (
    <article
      className={`relative rounded-[18px] border p-5 transition focus-within:ring-2 focus-within:ring-black hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] ${
        isSelected ? "border-gray-900 bg-white" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-[17px] font-bold text-gray-950">
              <Link
                href={selectHref}
                scroll={false}
                onClick={(e) => handleLinkClick(e, selectHref, { scroll: false })}
                aria-current={isSelected ? "true" : undefined}
                className="outline-none after:absolute after:inset-0 after:content-['']"
              >
                {post.title}
              </Link>
            </h3>
            <span
              className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                status === "RECRUITING"
                  ? "bg-gray-100 text-gray-700"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {statusLabel}
            </span>
          </div>

          <p className="max-w-130 text-sm leading-6 text-gray-500">
            {post.recruitNote}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {post.recruitPositionInfos.map((pos) => (
              <span
                key={pos.positionType}
                className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700"
              >
                {pos.positionType} ({pos.currentCount}/{pos.maxCount})
              </span>
            ))}
          </div>
        </div>

        <div className="shrink-0 rounded-2xl bg-gray-50 px-4 py-3 text-center">
          <p className="text-xs text-gray-500">{t("applicantCount")}</p>
          <p className="mt-1 text-xl font-bold text-gray-950">
            {post.totalApplicantCount}
          </p>
        </div>
      </div>

      {status !== "CLOSED" && (
        <div className="mt-5 flex gap-2">
          <Link
            href={editHref}
            onClick={(e) => handleLinkClick(e, editHref)}
            className="relative z-10 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            {t("edit")}
          </Link>
        </div>
      )}
    </article>
  );
}
