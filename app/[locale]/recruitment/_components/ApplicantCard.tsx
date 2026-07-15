"use client";

import type { ApplicantResponse } from "@/types/post";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface Props {
  applicant: ApplicantResponse;
  isClosed: boolean;
  isPending: boolean;
  onAccept: (applyUuid: string) => void;
  onReject: (applyUuid: string) => void;
}

export default function ApplicantCard({
  applicant,
  isClosed,
  isPending,
  onAccept,
  onReject,
}: Props) {
  const t = useTranslations("recruitment.applicantCard");
  const router = useRouter();

  return (
    <article className="rounded-[18px] border border-gray-200 bg-gray-50 p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-bold text-gray-950">{applicant.applicantName}</p>
          <button
            onClick={() => router.push(`/profile/${applicant.applicantUuid}`)}
            className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            {t("viewProfile")}
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {t("appliedFor", { position: applicant.positionType })}
        </p>
      </div>

      <p className="rounded-xl bg-white p-3 text-sm leading-6 text-gray-500">
        {applicant.introduction}
      </p>

      {!isClosed && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {applicant.portfolioUrl && (
            <a
              href={applicant.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              {t("viewPortfolio")}
            </a>
          )}
          {!applicant.portfolioUrl && (
            <span className="whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-xs text-gray-400">
              {t("noPortfolio")}
            </span>
          )}

          {applicant.status === "PENDING" && (
            <>
              <button
                onClick={() => onAccept(applicant.applyUuid)}
                disabled={isPending}
                className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
              >
                {t("accept")}
              </button>
              <button
                onClick={() => onReject(applicant.applyUuid)}
                disabled={isPending}
                className="rounded-lg bg-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-300 disabled:opacity-50"
              >
                {t("reject")}
              </button>
            </>
          )}

          {applicant.status === "ACCEPTED" && (
            <button
              disabled
              className="col-span-2 rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white"
            >
              {t("accepted")}
            </button>
          )}

          {applicant.status === "REJECTED" && (
            <button
              disabled
              className="col-span-2 rounded-lg bg-gray-300 px-3 py-2 text-xs font-semibold text-gray-700"
            >
              {t("rejected")}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
