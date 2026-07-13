"use client";

import type { ApplicantResponse, ResponsePosts } from "@/types/post";
import { useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();

  const selectedPost = posts.find((p) => p.uuid === selectedPostUuid);

  const handleAccept = (applyUuid: string) => {
    if (!selectedPostUuid) return;
    startTransition(() => acceptAction(selectedPostUuid, applyUuid));
  };

  const handleReject = (applyUuid: string) => {
    if (!selectedPostUuid) return;
    startTransition(() => rejectAction(selectedPostUuid, applyUuid));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
      <PostListSection posts={posts} selectedPostUuid={selectedPostUuid} />
      <ApplicantSection
        applicants={applicants}
        selectedPost={selectedPost}
        selectedPostUuid={selectedPostUuid}
        isPending={isPending}
        onAccept={handleAccept}
        onReject={handleReject}
      />
    </div>
  );
}
