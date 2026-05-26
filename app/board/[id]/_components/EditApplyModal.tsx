"use client";

import { updateApply } from "@/lib/apply";
import type { ResponseApplication } from "@/types/post";
import { useState } from "react";
import Modal from "./Modal";

type Props = {
  postUuid: string;
  application: ResponseApplication;
  onClose: () => void;
};

export default function EditApplyModal({ postUuid, application, onClose }: Props) {
  const [introduction, setIntroduction] = useState(application.introduction);
  const [portfolioUrl, setPortfolioUrl] = useState(application.portfolioUrl ?? "");

  const handleSave = async () => {
    try {
      await updateApply(postUuid, { introduction, portfolioUrl });
      sessionStorage.setItem("toastMessage", "지원서가 저장되었습니다.");
      onClose();
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal title="지원서 수정" onClose={onClose}>
      <div className="mb-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
        수정 후 다시 저장할 수 있습니다.
      </div>

      <label className="mb-4 block">
        <span className="mb-2 block text-sm font-medium">자기소개</span>
        <textarea
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
          onClick={handleSave}
          className="flex-1 rounded-xl bg-black py-3 text-sm font-semibold text-white"
        >
          저장하기
        </button>
      </div>
    </Modal>
  );
}
