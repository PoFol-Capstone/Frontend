"use client";

import type { ResponsePosts } from "@/types/post";
import { useRouter } from "next/navigation";
import { deriveStatus } from "./utils";

interface Props {
  post: ResponsePosts;
  isSelected: boolean;
}

export default function PostCard({ post, isSelected }: Props) {
  const router = useRouter();
  const status = deriveStatus(post);

  return (
    <article
      className={`rounded-[18px] border p-5 transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] ${
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
            onClick={() => router.push(`/recruitment?postId=${post.uuid}`)}
            className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            지원자 보기
          </button>
          <button
            onClick={() => router.push(`/recruitment/edit/${post.uuid}`)}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            수정하기
          </button>
        </div>
      )}
    </article>
  );
}
