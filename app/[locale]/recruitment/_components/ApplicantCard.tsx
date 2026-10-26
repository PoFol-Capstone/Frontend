"use client";

import { Avatar } from "@/components/Avatar";
import type { ApplicantResponse, ResponsePosts } from "@/types/post";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { usePositionLabel } from "./usePositionLabel";
import { formatAppliedDate, getApplicantActions } from "./utils";

interface Props {
  applicant: ApplicantResponse;
  /** 선택된 모집글 — 지원한 포지션의 정원으로 수락 가능 여부를 정한다 */
  post: ResponsePosts | undefined;
  isPending: boolean;
  onAccept: (applyUuid: string) => void;
  /** 바로 거절하지 않고 확인 창을 띄운다 */
  onReject: (applicant: ApplicantResponse) => void;
}

const STATUS_STYLE = {
  PENDING: "bg-white text-gray-600 ring-1 ring-gray-200",
  ACCEPTED: "bg-black text-white",
  REJECTED: "bg-gray-300 text-gray-700",
} as const;

const MAX_SKILLS = 5;
// 이 길이를 넘는 소개글만 접어서 보여준다 (3줄 남짓)
const LONG_INTRO = 120;

export default function ApplicantCard({
  applicant,
  post,
  isPending,
  onAccept,
  onReject,
}: Props) {
  const t = useTranslations("recruitment.applicantCard");
  const locale = useLocale();
  const positionLabel = usePositionLabel();
  const [expanded, setExpanded] = useState(false);
  const { canAccept, canReject, positionFull } = getApplicantActions(applicant, post);
  const statusLabel =
    applicant.status === "ACCEPTED"
      ? t("accepted")
      : applicant.status === "REJECTED"
        ? t("rejected")
        : t("pending");
  const appliedDate = formatAppliedDate(applicant.appliedAt, locale);
  const skills = applicant.applicantSkills ?? [];
  const hiddenSkills = skills.length - MAX_SKILLS;
  const isLongIntro = applicant.introduction.length > LONG_INTRO;

  return (
    <article className="rounded-[18px] border border-gray-200 bg-gray-50 p-4">
      <div className="mb-4 flex items-start gap-3">
        <Avatar src={applicant.applicantAvatarUrl} name={applicant.applicantName} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate font-bold text-gray-950">{applicant.applicantName}</p>
            <Link
              href={`/profile/${applicant.applicantUuid}`}
              className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              {t("viewProfile")}
            </Link>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm text-gray-500">
              {t("appliedFor", { position: positionLabel(applicant.positionType) })}
            </p>
            {/* 모집이 마감돼도 상태는 계속 보여준다 */}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[applicant.status]}`}
            >
              {statusLabel}
            </span>
            {appliedDate && (
              <span className="text-xs text-gray-400">
                {t("appliedAt", { date: appliedDate })}
              </span>
            )}
          </div>
        </div>
      </div>

      {skills.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-1.5" aria-label={t("skills")}>
          {skills.slice(0, MAX_SKILLS).map((skill) => (
            <li
              key={skill}
              className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-600"
            >
              {skill}
            </li>
          ))}
          {hiddenSkills > 0 && (
            <li className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              +{hiddenSkills}
            </li>
          )}
        </ul>
      )}

      <div className="rounded-xl bg-white p-3">
        <p
          className={`whitespace-pre-line text-sm leading-6 text-gray-600 ${
            isLongIntro && !expanded ? "line-clamp-3" : ""
          }`}
        >
          {applicant.introduction}
        </p>
        {isLongIntro && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="mt-1 text-xs font-semibold text-gray-500 hover:text-gray-900"
          >
            {expanded ? t("showLess") : t("showMore")}
          </button>
        )}
      </div>

      <div className={`mt-4 grid gap-2 ${canReject ? "grid-cols-3" : "grid-cols-1"}`}>
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
              onClick={() => onReject(applicant)}
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
