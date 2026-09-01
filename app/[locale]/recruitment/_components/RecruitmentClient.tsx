"use client";

import type { ActionResult } from "@/types/action";
import type { ApplicantResponse, ResponsePosts } from "@/types/post";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { acceptAction, rejectAction } from "../actions";
import ApplicantSection from "./ApplicantSection";
import PostListSection from "./PostListSection";

interface Props {
  posts: ResponsePosts[];
  applicants: ApplicantResponse[];
  selectedPostUuid: string | undefined;
}

export default function RecruitmentClient({
  posts,
  applicants,
  selectedPostUuid,
}: Props) {
  const t = useTranslations("recruitment.applicantSection");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selectedPost = posts.find((p) => p.uuid === selectedPostUuid);

  // 액션이 성공/실패를 반환값으로 알려주므로 실패 사유를 화면에 띄운다.
  // (예전엔 액션의 rejection이 transition 안에서 조용히 사라졌다)
  const runAction = (
    action: (postUuid: string, applyUuid: string) => Promise<ActionResult>,
    applyUuid: string,
  ) => {
    if (!selectedPostUuid) return;
    setError(null);
    startTransition(async () => {
      const result = await action(selectedPostUuid, applyUuid);
      if (!result.ok) setError(result.message || t("actionFailed"));
    });
  };

  const handleAccept = (applyUuid: string) => runAction(acceptAction, applyUuid);
  const handleReject = (applyUuid: string) => runAction(rejectAction, applyUuid);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
      <PostListSection posts={posts} selectedPostUuid={selectedPostUuid} />
      <ApplicantSection
        applicants={applicants}
        selectedPost={selectedPost}
        selectedPostUuid={selectedPostUuid}
        isPending={isPending}
        error={error}
        onAccept={handleAccept}
        onReject={handleReject}
      />
    </div>
  );
}
