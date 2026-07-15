"use client";

import type { ResponsePosts } from "@/types/post";
import { useNavigation } from "@/components/NavigationProvider";
import { useTranslations } from "next-intl";
import { deriveStatus } from "./utils";

interface Props {
  post: ResponsePosts;
  isSelected: boolean;
}

export default function PostCard({ post, isSelected }: Props) {
  const t = useTranslations("recruitment.postCard");
  const tStatus = useTranslations("recruitment.status");
  const { navigate } = useNavigation();
  const status = deriveStatus(post);
  const statusLabel =
    status === "CLOSED" ? tStatus("closed") : tStatus("recruiting");

  const handleSelect = () => {
    if (isSelected) return;
    navigate(`/recruitment?postId=${post.uuid}`, { scroll: false });
  };

  return (
    <article
      onClick={handleSelect}
      className={`cursor-pointer rounded-[18px] border p-5 transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] ${
        isSelected ? "border-gray-900 bg-white" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-[17px] font-bold text-gray-950">
              {post.title}
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/recruitment/edit/${post.uuid}`);
            }}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            {t("edit")}
          </button>
        </div>
      )}
    </article>
  );
}
