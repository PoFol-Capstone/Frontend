"use client";

import type { ApplicantResponse, ResponsePosts } from "@/types/post";
import { useTranslations } from "next-intl";
import { useState } from "react";
import ApplicantCard from "./ApplicantCard";
import PositionProgress from "./PositionProgress";
import {
  APPLICANT_FILTERS,
  countByStatus,
  filterApplicants,
  type ApplicantFilter,
} from "./utils";

interface Props {
  applicants: ApplicantResponse[];
  selectedPost: ResponsePosts | undefined;
  selectedPostUuid: string | undefined;
  isPending: boolean;
  error?: string | null;
  onAccept: (applyUuid: string) => void;
  onReject: (applicant: ApplicantResponse) => void;
}

export default function ApplicantSection({
  applicants,
  selectedPost,
  selectedPostUuid,
  isPending,
  error,
  onAccept,
  onReject,
}: Props) {
  const t = useTranslations("recruitment.applicantSection");
  const tFilter = useTranslations("recruitment.filter");
  // 글을 바꾸면 RecruitmentClient가 key로 이 섹션을 새로 만들어 필터가 "전체"로 돌아간다
  const [filter, setFilter] = useState<ApplicantFilter>("ALL");
  const counts = countByStatus(applicants);
  const visible = filterApplicants(applicants, filter);

  return (
    <aside
      id="applicants"
      className="scroll-mt-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)] sm:p-6 lg:sticky lg:top-6"
    >
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-950">{t("title")}</h2>
        <p className="mt-1 truncate text-sm text-gray-500">
          {selectedPost
            ? t("postApplicants", { title: selectedPost.title })
            : t("selectPostHint")}
        </p>
      </div>

      {selectedPost && selectedPost.recruitPositionInfos.length > 0 && (
        <div className="mb-5 space-y-2 rounded-2xl bg-gray-50 p-4">
          <p className="text-xs font-semibold text-gray-500">{t("positionSummary")}</p>
          {selectedPost.recruitPositionInfos.map((pos) => (
            <PositionProgress key={pos.positionType} position={pos} />
          ))}
        </div>
      )}

      {selectedPostUuid && applicants.length > 0 && (
        <div
          role="group"
          aria-label={tFilter("label")}
          className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1"
        >
          {APPLICANT_FILTERS.map((f) => {
            const selected = f === filter;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(f)}
                className={`flex flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  selected
                    ? "bg-white text-gray-950 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {tFilter(f)}
                <span className={selected ? "text-gray-500" : "text-gray-400"}>
                  {counts[f]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <p role="alert" className="mb-4 text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="space-y-4">
        {!selectedPostUuid && (
          <p className="py-8 text-center text-sm text-gray-400">
            {t("selectPostFromLeft")}
          </p>
        )}
        {selectedPostUuid && applicants.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">
            {t("noApplicants")}
          </p>
        )}
        {applicants.length > 0 && visible.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">
            {t("noFilteredApplicants", { status: tFilter(filter) })}
          </p>
        )}
        {visible.map((applicant) => (
          <ApplicantCard
            key={applicant.applyUuid}
            applicant={applicant}
            post={selectedPost}
            isPending={isPending}
            onAccept={onAccept}
            onReject={onReject}
          />
        ))}
      </div>
    </aside>
  );
}
