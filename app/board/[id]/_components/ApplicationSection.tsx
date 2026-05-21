"use client";

import { cancelApply, getApply, submitApply, updateApply } from "@/lib/apply";
import type {
  RecruitPositionResponse,
  ResponseApplication,
} from "@/types/post";
import { PostType } from "@/types/post";
import { useEffect, useState } from "react";

type Props = {
  postUuid: string;
  postType: PostType;
  recruitPositions: RecruitPositionResponse[];
};

export default function ApplicationSection({
  postUuid,
  postType,
  recruitPositions,
}: Props) {
  const [application, setApplication] = useState<ResponseApplication | null>(
    null,
  );
  const [toast, setToast] = useState("");
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  useEffect(() => {
    getApply(postUuid).then(setApplication);
  }, [postUuid]);
      useEffect(() => {
  const savedToast = sessionStorage.getItem("toastMessage");
    if (savedToast) {
      setToast(savedToast);

      sessionStorage.removeItem("toastMessage");

      setTimeout(() => {
        setToast("");
      }, 2500);
    }
  }, []);

  if (postType !== PostType.RECRUIT) return null;

  const openApplicationModal = () => {
    if (application) setIsViewOpen(true);
    else setIsApplyOpen(true);
  };

  const handleSubmit = async () => {
    const updated = await submitApply(postUuid, {
      positionType: selectedPosition,
      introduction,
      portfolioUrl,
    });
    setApplication(updated);
    setIsApplyOpen(false);
  };

  const openEditModal = () => {
    if (!application) return;
    setIntroduction(application.introduction);
    setPortfolioUrl(application.portfolioUrl ?? "");
    setIsViewOpen(false);
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    try {
      const updated = await updateApply(postUuid, {
        introduction,
        portfolioUrl,
      });

      setApplication(updated);

      sessionStorage.setItem(
        "toastMessage",
        "지원서가 저장되었습니다.",
      );

      setIsEditOpen(false);

      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancel = async () => {
    await cancelApply(postUuid);
    setApplication(null);
    setIsViewOpen(false);
  };

  const isPending = application?.status === "PENDING";

  return (
    <>
      {application && (
        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
          <p className="font-semibold">지원 완료</p>
          <p className="mt-1">
            이미 지원한 프로젝트입니다. 지원 내용을 확인하거나 수정할 수 있어요.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={openApplicationModal}
        className="w-full rounded-xl bg-black py-3 text-sm font-semibold text-white hover:bg-gray-800"
      >
        {application ? "지원서 확인" : "지원하기"}
      </button>

      {isApplyOpen && (
        <Modal title="지원하기" onClose={() => setIsApplyOpen(false)}>
          <PositionSelector
            positions={recruitPositions}
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
              onClick={() => setIsApplyOpen(false)}
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
      )}

      {isViewOpen && application && (
        <Modal title="지원 내역" onClose={() => setIsViewOpen(false)}>
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
              onClick={() => setIsViewOpen(false)}
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
                  onClick={openEditModal}
                  className="flex-1 rounded-xl bg-black py-3 text-sm font-semibold text-white"
                >
                  수정하기
                </button>
              </>
            )}
          </div>
        </Modal>
      )}

      {isEditOpen && application && (
        <Modal title="지원서 수정" onClose={() => setIsEditOpen(false)}>
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
              onClick={() => setIsEditOpen(false)}
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
      )}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2 rounded-full bg-black px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xl text-gray-400 hover:text-black"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PositionSelector({
  positions,
  selectedPosition,
  onSelect,
}: {
  positions: RecruitPositionResponse[];
  selectedPosition: string;
  onSelect: (p: string) => void;
}) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-sm font-medium">지원할 포지션</p>
      <div className="flex flex-wrap gap-2">
        {positions.map((pos) => {
          const isSelected = selectedPosition === pos.positionType;
          return (
            <button
              key={pos.positionType}
              type="button"
              disabled={pos.isFull}
              onClick={() => onSelect(pos.positionType)}
              className={`rounded-full border px-3 py-1 text-xs ${
                pos.isFull
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : isSelected
                    ? "border-black bg-black text-white"
                    : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              {pos.positionType} ({pos.currentCount}/{pos.maxCount})
            </button>
          );
        })}
      </div>
    </div>
  );
}
