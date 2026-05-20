"use client";

import type { ApplicantResponse, ResponsePosts } from "@/types/post";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { acceptAction, rejectAction } from "../actions";

interface Props {
  posts: ResponsePosts[];
  applicants: ApplicantResponse[];
  selectedPostUuid: string | undefined;
}

function deriveStatus(post: ResponsePosts): string {
  if (!post.isPublished) return "마감";
  const allFull = post.recruitPositionInfos.every((p) => p.isFull);
  return allFull ? "마감" : "모집중";
}

export default function RecruitmentClient({
  posts,
  applicants,
  selectedPostUuid,
}: Props) {
  const router = useRouter();
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
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-950">내 모집글</h2>
            <p className="mt-1 text-sm text-gray-500">
              현재 등록한 팀원 모집 게시글이에요.
            </p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {posts.length}개
          </span>
        </div>

        <div className="space-y-4">
          {posts.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">
              등록한 모집글이 없어요.
            </p>
          )}
          {posts.map((post) => {
            const status = deriveStatus(post);
            const isSelected = post.uuid === selectedPostUuid;
            return (
              <article
                key={post.uuid}
                className={`rounded-[18px] border p-5 transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] ${
                  isSelected
                    ? "border-gray-900 bg-white"
                    : "border-gray-200 bg-white"
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
                          status === "모집중"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        {status}
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
                    <p className="text-xs text-gray-500">지원자</p>
                    <p className="mt-1 text-xl font-bold text-gray-950">
                      {post.totalApplicantCount}
                    </p>
                  </div>
                </div>

                {status !== "마감" && (
                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={() =>
                        router.push(`/recruitment?postId=${post.uuid}`)
                      }
                      className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      지원자 보기
                    </button>
                    <button
                      onClick={() =>
                        router.push(`/recruitment/edit/${post.uuid}`)
                      }
                      className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      수정하기
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <aside className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-950">지원자 현황</h2>
          <p className="mt-1 text-sm text-gray-500">
            {selectedPost
              ? `"${selectedPost.title}" 지원자`
              : "게시글을 선택해주세요."}
          </p>
        </div>

        <div className="space-y-4">
          {!selectedPostUuid && (
            <p className="py-8 text-center text-sm text-gray-400">
              왼쪽에서 게시글을 선택해주세요.
            </p>
          )}
          {selectedPostUuid && applicants.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">
              아직 지원자가 없어요.
            </p>
          )}
          {applicants.map((applicant) => {
            const isClosed = selectedPost
              ? deriveStatus(selectedPost) === "마감"
              : false;
            return (
              <article
                key={applicant.uuid}
                className="rounded-[18px] border border-gray-200 bg-gray-50 p-4"
              >
                <div className="mb-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-gray-950">
                      {applicant.applicantName}
                    </p>
                    <button
                      onClick={() =>
                        router.push(`/profile/${applicant.applicantUuid}`)
                      }
                      className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      프로필 보기
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {applicant.positionType} 지원
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
                        포트폴리오 보기
                      </a>
                    )}
                    {!applicant.portfolioUrl && (
                      <span className="whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-xs text-gray-400">
                        포트폴리오 없음
                      </span>
                    )}

                    {applicant.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleAccept(applicant.uuid)}
                          disabled={isPending}
                          className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
                        >
                          수락
                        </button>
                        <button
                          onClick={() => handleReject(applicant.uuid)}
                          disabled={isPending}
                          className="rounded-lg bg-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-300 disabled:opacity-50"
                        >
                          거절
                        </button>
                      </>
                    )}

                    {applicant.status === "ACCEPTED" && (
                      <button
                        disabled
                        className="col-span-2 rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white"
                      >
                        수락됨
                      </button>
                    )}

                    {applicant.status === "REJECTED" && (
                      <button
                        disabled
                        className="col-span-2 rounded-lg bg-gray-300 px-3 py-2 text-xs font-semibold text-gray-700"
                      >
                        거절됨
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
