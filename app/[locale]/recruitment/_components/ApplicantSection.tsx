"use client";

import type { ApplicantResponse, ResponsePosts } from "@/types/post";
import { useTranslations } from "next-intl";
import ApplicantCard from "./ApplicantCard";
import { deriveStatus } from "./utils";

interface Props {
  applicants: ApplicantResponse[];
  selectedPost: ResponsePosts | undefined;
  selectedPostUuid: string | undefined;
  isPending: boolean;
  error?: string | null;
  onAccept: (applyUuid: string) => void;
  onReject: (applyUuid: string) => void;
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
  const isClosed = selectedPost ? deriveStatus(selectedPost) === "CLOSED" : false;

  return (
    <aside className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-950">{t("title")}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {selectedPost
            ? t("postApplicants", { title: selectedPost.title })
            : t("selectPostHint")}
        </p>
      </div>

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
        {applicants.map((applicant) => (
          <ApplicantCard
            key={applicant.applyUuid}
            applicant={applicant}
            isClosed={isClosed}
            isPending={isPending}
            onAccept={onAccept}
            onReject={onReject}
          />
        ))}
      </div>
    </aside>
  );
}
