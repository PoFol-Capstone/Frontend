"use client";

import type { ResponsePosts } from "@/types/post";
import { Link } from "@/i18n/navigation";
import { useNavigation } from "@/components/NavigationProvider";
import { useTranslations } from "next-intl";
import PositionProgress from "./PositionProgress";
import { deriveStatus, type RecruitStatus } from "./utils";

interface Props {
  post: ResponsePosts;
  isSelected: boolean;
  isPending: boolean;
  /** 마감은 확인 창을 거치고, 재개는 바로 처리한다 (RecruitmentClient) */
  onToggleRecruiting: (post: ResponsePosts) => void;
}

/** 모집글 수정은 게시글 수정 화면을 쓴다 (예전 /recruitment/edit/{uuid}는 없는 경로라 404였다) */
export function recruitmentEditHref(postUuid: string) {
  return `/board/${postUuid}/edit`;
}

const STATUS_STYLE: Record<RecruitStatus, string> = {
  RECRUITING: "bg-black text-white",
  FULL: "bg-gray-200 text-gray-700",
  CLOSED: "bg-gray-100 text-gray-500 ring-1 ring-gray-200",
};

export default function PostCard({ post, isSelected, isPending, onToggleRecruiting }: Props) {
  const t = useTranslations("recruitment.postCard");
  const tStatus = useTranslations("recruitment.status");
  const { handleLinkClick } = useNavigation();
  const status = deriveStatus(post);
  const statusLabel =
    status === "CLOSED"
      ? tStatus("closed")
      : status === "FULL"
        ? tStatus("full")
        : tStatus("recruiting");
  const isRecruiting = post.isRecruiting !== false;
  // 모바일에선 지원자 패널이 목록 아래에 있으므로 선택하면 그 위치로 이동한다
  const selectHref = `/recruitment?postId=${post.uuid}#applicants`;
  const editHref = recruitmentEditHref(post.uuid);

  // 카드 전체가 "이 글 선택" 영역이지만 실제 링크는 제목 하나다(::after가 카드를 덮는다).
  // 예전엔 onClick만 있는 article이라 키보드로 선택할 수 없었고, 수정 버튼이 그 안에 중첩돼 있었다.
  // 마감된 글도 정원을 늘리거나 내용을 고칠 수 있도록 수정 버튼은 항상 보인다.
  return (
    <article
      className={`relative rounded-[18px] border p-4 transition focus-within:ring-2 focus-within:ring-black hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] sm:p-5 ${
        isSelected ? "border-gray-900 bg-white" : "border-gray-200 bg-white"
      } ${status === "CLOSED" ? "opacity-80" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 text-[17px] font-bold text-gray-950">
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
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[status]}`}
            >
              {statusLabel}
            </span>
          </div>

          {post.recruitNote && (
            <p className="line-clamp-2 max-w-130 text-sm leading-6 text-gray-500">
              {post.recruitNote}
            </p>
          )}
        </div>

        <div className="shrink-0 rounded-2xl bg-gray-50 px-4 py-3 text-center">
          <p className="text-xs text-gray-500">{t("applicantCount")}</p>
          <p className="mt-1 text-xl font-bold text-gray-950">
            {post.totalApplicantCount}
          </p>
        </div>
      </div>

      {post.recruitPositionInfos.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {post.recruitPositionInfos.map((pos) => (
            <PositionProgress key={pos.positionType} position={pos} />
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={editHref}
          onClick={(e) => handleLinkClick(e, editHref)}
          className="relative z-10 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          {t("edit")}
        </Link>
        <button
          type="button"
          onClick={() => onToggleRecruiting(post)}
          disabled={isPending}
          className={`relative z-10 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            isRecruiting
              ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              : "bg-black text-white hover:bg-gray-800"
          }`}
        >
          {isRecruiting ? t("close") : t("reopen")}
        </button>
      </div>
    </article>
  );
}
