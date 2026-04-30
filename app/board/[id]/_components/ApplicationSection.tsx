"use client";

import { useState } from "react";
import { applyToPost } from "@/lib/post";
import type { ResponseApplication } from "@/types/post";

type Props = {
  postUuid: string;
  recruitPosition: string;
  isRecruiting: boolean;
};

export default function ApplicationSection({
  postUuid,
  recruitPosition,
  isRecruiting,
}: Props) {
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [application, setApplication] = useState<ResponseApplication | null>(
    null,
  );
  const [message, setMessage] = useState("");

  if (!isRecruiting) return null;

  const openModal = () => {
    if (application) setIsViewOpen(true);
    else setIsApplyOpen(true);
  };

  const submitApplication = async () => {
    const res = await applyToPost(postUuid, { position: recruitPosition, message });
    setApplication(res);
    setIsApplyOpen(false);
    setMessage("");
  };

  const openEditModal = () => {
    if (!application) return;
    setMessage(application.message);
    setIsViewOpen(false);
    setIsEditOpen(true);
  };

  const saveEdit = () => {
    if (!application) return;
    setApplication({ ...application, message });
    setIsEditOpen(false);
  };

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
        onClick={openModal}
        className="w-full rounded-xl bg-black py-3 text-sm font-semibold text-white hover:bg-gray-800"
      >
        {application ? "지원서 확인" : "지원하기"}
      </button>

      {isApplyOpen && (
        <Modal title="지원하기" onClose={() => setIsApplyOpen(false)}>
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium">지원할 포지션</p>
            <span className="rounded-full border border-black bg-black px-3 py-1 text-xs text-white">
              {recruitPosition}
            </span>
          </div>

          <label className="mb-5 block">
            <span className="mb-2 block text-sm font-medium">지원 메시지</span>
            <textarea
              placeholder="간단한 자기소개를 작성해주세요."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="h-28 w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-black"
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
              onClick={submitApplication}
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
              제출한 지원서입니다. 마감 전까지 수정할 수 있어요.
            </p>
          </div>

          <div className="mb-4">
            <p className="mb-2 text-sm font-medium">지원한 포지션</p>
            <span className="rounded-full border border-black px-3 py-1 text-xs">
              {application.position}
            </span>
          </div>

          <div className="mb-5">
            <p className="mb-2 text-sm font-medium">지원 메시지</p>
            <div className="min-h-24 rounded-xl border border-gray-200 p-3 text-sm text-gray-700">
              {application.message || "작성된 내용이 없습니다."}
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
            <button
              type="button"
              onClick={openEditModal}
              className="flex-1 rounded-xl bg-black py-3 text-sm font-semibold text-white"
            >
              수정하기
            </button>
          </div>
        </Modal>
      )}

      {isEditOpen && application && (
        <Modal title="지원서 수정" onClose={() => setIsEditOpen(false)}>
          <div className="mb-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
            수정 후 다시 저장할 수 있습니다.
          </div>

          <label className="mb-5 block">
            <span className="mb-2 block text-sm font-medium">지원 메시지</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="h-28 w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-black"
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
              onClick={saveEdit}
              className="flex-1 rounded-xl bg-black py-3 text-sm font-semibold text-white"
            >
              저장하기
            </button>
          </div>
        </Modal>
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
