"use client";

import type { RecruitPositionResponse } from "@/types/post";
import { PostType } from "@/types/post";

type Props = {
  postUuid: string;
  postType: PostType;
  recruitPositions: RecruitPositionResponse[];
};

export default function ApplicationSection({ postType }: Props) {
  if (postType !== PostType.RECRUIT) return null;

  return (
    <button
      type="button"
      className="w-full rounded-xl bg-black py-3 text-sm font-semibold text-white hover:bg-gray-800"
    >
      지원하기
    </button>
  );
}
