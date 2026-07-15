"use client";

import { cancelApply } from "@/lib/apply";
import type { ResponseApplication } from "@/types/post";
import Modal from "./Modal";

type Props = {
  postUuid: string;
  application: ResponseApplication;
  onClose: () => void;
  onEdit: () => void;
  onCancel: () => void;
};

export default function ViewApplyModal({
  postUuid,
  application,
  onClose,
  onEdit,
  onCancel,
}: Props) {
  const isPending = application.status === "PENDING";

  const handleCancel = async () => {
    await cancelApply(postUuid);
    onCancel();
  };

  return (
    <Modal title="지원 내역" onClose={onClose}>
      <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
        <p className="font-semibold">지원 완료</p>
        <p className="mt-1">
          {isPending
            ? "마감 전까지 수정할 수 있어요."
            : "수정이 불가능한 상태입니다."}
        </p>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-sm font-medium">지원한 포지션</p>
        <span className="rounded-full border border-black px-3 py-1 text-xs">
          {application.positionType}
        </span>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-sm font-medium">자기소개</p>
        <div className="min-h-24 rounded-xl border border-gray-200 p-3 text-sm text-gray-700">
          {application.introduction || "작성된 내용이 없습니다."}
        </div>
      </div>

      <div className="mb-5">
        <p className="mb-2 text-sm font-medium">포트폴리오 / GitHub</p>
        <div className="rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-500">
          {application.portfolioUrl || "작성된 내용이 없습니다."}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-gray-200 py-3 text-sm"
        >
          닫기
        </button>
        {isPending && (
          <>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 rounded-xl border border-red-200 py-3 text-sm text-red-500"
            >
              취소하기
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="flex-1 rounded-xl bg-black py-3 text-sm font-semibold text-white"
            >
              수정하기
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
