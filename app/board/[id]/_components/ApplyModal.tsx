"use client";

import { submitApply } from "@/lib/apply";
import type { RecruitPositionResponse, ResponseApplication } from "@/types/post";
import { useState } from "react";
import Modal from "./Modal";
import PositionSelector from "./PositionSelector";

type Props = {
  postUuid: string;
  positions: RecruitPositionResponse[];
  onSuccess: (application: ResponseApplication) => void;
  onClose: () => void;
};

export default function ApplyModal({
  postUuid,
  positions,
  onSuccess,
  onClose,
}: Props) {
  const [selectedPosition, setSelectedPosition] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  const handleSubmit = async () => {
    const updated = await submitApply(postUuid, {
      positionType: selectedPosition,
      introduction,
      portfolioUrl,
    });
    onSuccess(updated);
    onClose();
  };

  return (
    <Modal title="지원하기" onClose={onClose}>
      <PositionSelector
        positions={positions}
        selectedPosition={selectedPosition}
        onSelect={setSelectedPosition}
      />

      <label className="mb-4 block">
        <span className="mb-2 block text-sm font-medium">자기소개</span>
        <textarea
          placeholder="간단한 자기소개를 작성해주세요."
          value={introduction}
          onChange={(e) => setIntroduction(e.target.value)}
          className="h-28 w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-black"
        />
      </label>

      <label className="mb-5 block">
        <span className="mb-2 block text-sm font-medium">
          포트폴리오 / GitHub
        </span>
        <input
          placeholder="https://github.com/username"
          value={portfolioUrl}
          onChange={(e) => setPortfolioUrl(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-black"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-gray-200 py-3 text-sm"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="flex-1 rounded-xl bg-black py-3 text-sm font-semibold text-white"
        >
          지원하기
        </button>
      </div>
    </Modal>
  );
}
