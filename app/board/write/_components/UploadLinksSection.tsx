"use client";
import { useState } from "react";

export type UploadSectionId = "erd" | "figma" | "class" | "extra";

const UPLOAD_SECTIONS: { id: UploadSectionId; title: string; subtitle: string; label: string }[] = [
  { id: "erd", title: "ERD 업로드", subtitle: "데이터베이스 설계 다이어그램", label: "ERD" },
  { id: "figma", title: "피그마 구조도", subtitle: "UI/UX 디자인 파일", label: "UI" },
  { id: "class", title: "클래스 다이어그램", subtitle: "시스템 구조 설계 문서", label: "CLS" },
  { id: "extra", title: "추가 자료", subtitle: "UML, 플로우차트 등", label: "+" },
];

type Props = {
  uploadLinks: Record<UploadSectionId, string>;
  onChange: (id: UploadSectionId, url: string) => void;
};

export default function UploadLinksSection({ uploadLinks, onChange }: Props) {
  const [activeUpload, setActiveUpload] = useState<UploadSectionId | null>(null);
  const [tempLink, setTempLink] = useState("");

  const openModal = (id: UploadSectionId) => {
    setTempLink(uploadLinks[id]);
    setActiveUpload(id);
  };

  const handleSave = () => {
    if (!activeUpload) return;
    onChange(activeUpload, tempLink.trim());
    setActiveUpload(null);
  };

  const activeSection = UPLOAD_SECTIONS.find((s) => s.id === activeUpload);

  return (
    <section className="border border-gray-200 rounded-2xl p-6 space-y-4 bg-white">
      <div>
        <h2 className="text-base font-semibold">추가 자료 링크</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          ERD, Figma 등 외부 링크를 붙여넣어 게시물에 표시합니다.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {UPLOAD_SECTIONS.map((section) => {
          const linked = !!uploadLinks[section.id];
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => openModal(section.id)}
              className={`border rounded-2xl p-5 flex flex-col items-center gap-2 text-center bg-white transition-colors ${
                linked ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-xs font-bold ${
                  linked ? "border-blue-400 text-blue-500" : "border-gray-200 text-gray-400"
                }`}
              >
                {linked ? "✓" : section.label}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{section.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{section.subtitle}</p>
              </div>
              <p className="text-xs mt-1 truncate max-w-full px-2">
                {linked ? (
                  <span className="text-blue-500">{uploadLinks[section.id]}</span>
                ) : (
                  <span className="text-gray-400">클릭하여 링크 추가</span>
                )}
              </p>
            </button>
          );
        })}
      </div>

      {activeUpload && activeSection && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setActiveUpload(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-semibold">{activeSection.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{activeSection.subtitle}</p>
            </div>
            <input
              type="url"
              value={tempLink}
              onChange={(e) => setTempLink(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              placeholder="https://..."
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-900"
              >
                저장
              </button>
              {uploadLinks[activeUpload] && (
                <button
                  type="button"
                  onClick={() => { onChange(activeUpload, ""); setActiveUpload(null); }}
                  className="px-4 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50"
                >
                  삭제
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveUpload(null)}
                className="px-4 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
