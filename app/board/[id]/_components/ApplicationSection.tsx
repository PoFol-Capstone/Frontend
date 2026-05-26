"use client";

import { getApply } from "@/lib/apply";
import type {
  RecruitPositionResponse,
  ResponseApplication,
} from "@/types/post";
import { PostType } from "@/types/post";
import { useEffect, useState } from "react";
import ApplyModal from "./ApplyModal";
import EditApplyModal from "./EditApplyModal";
import ViewApplyModal from "./ViewApplyModal";

type Props = {
  postUuid: string;
  postType: PostType;
  recruitPositions: RecruitPositionResponse[];
  isAuthor?: boolean;
};

export default function ApplicationSection({
  postUuid,
  postType,
  recruitPositions,
  isAuthor = false,
}: Props) {
  const [application, setApplication] = useState<ResponseApplication | null>(
    null,
  );
  const [toast, setToast] = useState(() => {
    const saved = sessionStorage.getItem("toastMessage");
    if (saved) {
      sessionStorage.removeItem("toastMessage");
      return saved;
    }
    return "";
  });
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    getApply(postUuid).then(setApplication);
  }, [postUuid]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  if (postType !== PostType.RECRUIT) return null;

  const openApplicationModal = () => {
    if (application) setIsViewOpen(true);
    else setIsApplyOpen(true);
  };

  return (
    <>
      {!isAuthor && (
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
        </>
      )}

      {isApplyOpen && (
        <ApplyModal
          postUuid={postUuid}
          positions={recruitPositions}
          onSuccess={setApplication}
          onClose={() => setIsApplyOpen(false)}
        />
      )}

      {isViewOpen && application && (
        <ViewApplyModal
          postUuid={postUuid}
          application={application}
          onClose={() => setIsViewOpen(false)}
          onEdit={() => { setIsViewOpen(false); setIsEditOpen(true); }}
          onCancel={() => { setApplication(null); setIsViewOpen(false); }}
        />
      )}

      {isEditOpen && application && (
        <EditApplyModal
          postUuid={postUuid}
          application={application}
          onClose={() => setIsEditOpen(false)}
        />
      )}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-9999 -translate-x-1/2 rounded-full bg-black px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}

