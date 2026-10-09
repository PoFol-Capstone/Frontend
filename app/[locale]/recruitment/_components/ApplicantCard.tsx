"use client";

import type { ApplicantResponse, ResponsePosts } from "@/types/post";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { getApplicantActions } from "./utils";

interface Props {
  applicant: ApplicantResponse;
  /** 선택된 모집글 — 지원한 포지션의 정원으로 수락 가능 여부를 정한다 */
  post: ResponsePosts | undefined;
  isPending: boolean;
  onAccept: (applyUuid: string) => void;
  onReject: (applyUuid: string) => void;
}

const STATUS_STYLE = {
  PENDING: "bg-white text-gray-600 ring-1 ring-gray-200",
  ACCEPTED: "bg-black text-white",
  REJECTED: "bg-gray-300 text-gray-700",
} as const;

export default function ApplicantCard({
  applicant,
  post,
  isPending,
  onAccept,
  onReject,
}: Props) {
  const t = useTranslations("recruitment.applicantCard");
  const { canAccept, canReject, positionFull } = getApplicantActions(applicant, post);
  const statusLabel =
    applicant.status === "ACCEPTED"
      ? t("accepted")
      : applicant.status === "REJECTED"
        ? t("rejected")
        : t("pending");

  return (
    <article className="rounded-[18px] border border-gray-200 bg-gray-50 p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-bold text-gray-950">{applicant.applicantName}</p>
          <Link
            href={`/profile/${applicant.applicantUuid}`}
            className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            {t("viewProfile")}
          </Link>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-sm text-gray-500">
            {t("appliedFor", { position: applicant.positionType })}
          </p>
          {/* 모집이 마감돼도 상태는 계속 보여준다 */}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[applicant.status]}`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      <p className="rounded-xl bg-white p-3 text-sm leading-6 text-gray-500">
        {applicant.introduction}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {applicant.portfolioUrl ? (
          <a
            href={applicant.portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            {t("viewPortfolio")}
          </a>
        ) : (
          <span className="whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-xs text-gray-400">
            {t("noPortfolio")}
          </span>
        )}

        {canReject && (
          <>
            <button
              type="button"
              onClick={() => onAccept(applicant.applyUuid)}
              disabled={isPending || !canAccept}
              className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("accept")}
            </button>
            <button
              type="button"
              onClick={() => onReject(applicant.applyUuid)}
              disabled={isPending}
              className="rounded-lg bg-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-300 disabled:opacity-50"
            >
              {t("reject")}
            </button>
          </>
        )}
      </div>

      {canReject && positionFull && (
        <p className="mt-2 text-xs text-gray-500">{t("positionFull")}</p>
      )}
    </article>
  );
}
