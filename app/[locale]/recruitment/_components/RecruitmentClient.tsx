"use client";

import type { ActionResult } from "@/types/action";
import type { ApplicantResponse, ResponsePosts } from "@/types/post";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { acceptAction, rejectAction, toggleRecruitingAction } from "../actions";
import ApplicantSection from "./ApplicantSection";
import ConfirmDialog from "./ConfirmDialog";
import PostListSection from "./PostListSection";

interface Props {
  posts: ResponsePosts[];
  applicants: ApplicantResponse[];
  selectedPostUuid: string | undefined;
}

type Confirm =
  | { kind: "reject"; applicant: ApplicantResponse }
  | { kind: "close"; post: ResponsePosts };

export default function RecruitmentClient({
  posts,
  applicants,
  selectedPostUuid,
}: Props) {
  const t = useTranslations("recruitment");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  const selectedPost = posts.find((p) => p.uuid === selectedPostUuid);

  // 액션이 성공/실패를 반환값으로 알려주므로 실패 사유를 화면에 띄운다.
  // (예전엔 액션의 rejection이 transition 안에서 조용히 사라졌다)
  const run = (
    action: () => Promise<ActionResult>,
    onError: (message: string) => void,
  ) => {
    startTransition(async () => {
      const result = await action();
      setConfirm(null);
      if (!result.ok) onError(result.message || t("applicantSection.actionFailed"));
    });
  };

  const runApplicantAction = (
    action: (postUuid: string, applyUuid: string) => Promise<ActionResult>,
    applyUuid: string,
  ) => {
    if (!selectedPostUuid) return;
    setError(null);
    run(() => action(selectedPostUuid, applyUuid), setError);
  };

  const setRecruiting = (post: ResponsePosts, recruiting: boolean) => {
    setPostError(null);
    run(() => toggleRecruitingAction(post.uuid, recruiting), setPostError);
  };

  const handleAccept = (applyUuid: string) => runApplicantAction(acceptAction, applyUuid);
  const handleReject = (applicant: ApplicantResponse) =>
    setConfirm({ kind: "reject", applicant });
  // 마감은 새 지원을 막으므로 확인을 거치고, 재개는 바로 처리한다
  const handleToggleRecruiting = (post: ResponsePosts) => {
    if (post.isRecruiting !== false) setConfirm({ kind: "close", post });
    else setRecruiting(post, true);
  };

  const closeConfirm = () => {
    if (!isPending) setConfirm(null);
  };

  return (
    <>
      {postError && (
        <p role="alert" className="mb-4 text-sm text-red-500">
          {postError}
        </p>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <PostListSection
          posts={posts}
          selectedPostUuid={selectedPostUuid}
          isPending={isPending}
          onToggleRecruiting={handleToggleRecruiting}
        />
        <ApplicantSection
          // 다른 글을 고르면 필터·펼침 상태를 처음부터 시작한다
          key={selectedPostUuid ?? "none"}
          applicants={applicants}
          selectedPost={selectedPost}
          selectedPostUuid={selectedPostUuid}
          isPending={isPending}
          error={error}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      </div>

      {confirm?.kind === "reject" && (
        <ConfirmDialog
          title={t("confirm.rejectTitle")}
          description={t("confirm.rejectDescription", {
            name: confirm.applicant.applicantName,
          })}
          confirmLabel={t("applicantCard.reject")}
          isPending={isPending}
          onConfirm={() => runApplicantAction(rejectAction, confirm.applicant.applyUuid)}
          onClose={closeConfirm}
        />
      )}
      {confirm?.kind === "close" && (
        <ConfirmDialog
          title={t("confirm.closeTitle")}
          description={t("confirm.closeDescription", { title: confirm.post.title })}
          confirmLabel={t("postCard.close")}
          isPending={isPending}
          onConfirm={() => setRecruiting(confirm.post, false)}
          onClose={closeConfirm}
        />
      )}
    </>
  );
}
