"use client";

import { X } from "lucide-react";

interface Props {
  onClose: () => void;
}

export default function ProfileEditModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white px-8 py-8 text-left shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-7 top-7 text-gray-400 transition hover:text-black"
        >
          <X size={24} />
        </button>

        <div className="mb-8 pr-10">
          <h2 className="text-3xl font-bold tracking-tight">프로필 수정</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            프로필 정보를 수정할 수 있습니다.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="mb-2.5 block text-base font-semibold text-gray-900">
              직무
            </label>
            <input
              type="text"
              placeholder="프론트엔드, 백엔드, .."
              className="min-h-10.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
            />
          </div>

          <div>
            <label className="mb-2.5 block text-base font-semibold text-gray-900">
              연차
            </label>
            <input
              type="number"
              placeholder="1"
              className="min-h-10.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
            />
          </div>

          <div>
            <label className="mb-2.5 block text-base font-semibold text-gray-900">
              소개글
            </label>
            <textarea
              rows={5}
              placeholder="소개글을 입력해주세요."
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
            />
          </div>

          <div>
            <label className="mb-2.5 block text-base font-semibold text-gray-900">
              GitHub
            </label>
            <input
              type="text"
              placeholder="GitHub 링크"
              className="min-h-10.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
            />
          </div>

          <div>
            <label className="mb-2.5 block text-base font-semibold text-gray-900">
              Notion
            </label>
            <input
              type="text"
              placeholder="Notion 링크"
              className="min-h-10.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
            />
          </div>

          <div>
            <label className="mb-2.5 block text-base font-semibold text-gray-900">
              Email
            </label>
            <input
              type="email"
              placeholder="이메일"
              className="min-h-10.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-3 min-h-10.5 w-full rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}