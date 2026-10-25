"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { upload } from "@vercel/blob/client";
import { FileText, Presentation, Trash2 } from "lucide-react";
import { toSlidesEmbedUrl } from "@/lib/slides";
import { DOCUMENT_CONTENT_TYPE, MAX_DOCUMENT_BYTES, MAX_DOCUMENT_MB } from "@/lib/uploadLimits";
import type { PostDocument } from "@/types/post";

type Props = {
  value: PostDocument | null;
  onChange: (next: PostDocument | null) => void;
  /** 업로드 중에는 제출을 막는다 */
  onUploadingChange?: (uploading: boolean) => void;
};

// 이보다 큰 PDF는 분할 업로드(재시도 포함)로 보낸다
const MULTIPART_THRESHOLD = 5 * 1024 * 1024;

/** 업로드 경로에 쓸 수 있는 파일 이름 (토큰 발급 라우트가 documents/{name}.pdf 형식만 받는다) */
function safeBaseName(fileName: string): string {
  const base = fileName.replace(/\.pdf$/i, "").replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return base.slice(0, 60) || "document";
}

/**
 * 3.5 발표자료 — PDF 업로드(브라우저 → Vercel Blob 직접) 또는 구글 슬라이드 링크 중 하나.
 * 게시글당 1건이며, 저장할 URL은 백엔드가 출처를 다시 검증한다.
 */
export default function DocumentSection({ value, onChange, onUploadingChange }: Props) {
  const t = useTranslations("board.document");
  const [mode, setMode] = useState<"PDF" | "GOOGLE_SLIDES">(value?.type ?? "PDF");
  const [slidesInput, setSlidesInput] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const setUploading = (uploading: boolean) => {
    setProgress(uploading ? 0 : null);
    onUploadingChange?.(uploading);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (file.type !== DOCUMENT_CONTENT_TYPE) {
      setError(t("pdfOnly"));
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setError(t("tooLarge", { max: MAX_DOCUMENT_MB }));
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const blob = await upload(`documents/${safeBaseName(file.name)}.pdf`, file, {
        access: "public",
        handleUploadUrl: "/api/upload/document",
        contentType: DOCUMENT_CONTENT_TYPE,
        multipart: file.size > MULTIPART_THRESHOLD,
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });
      setFileName(file.name);
      onChange({ type: "PDF", url: blob.url, fileSize: file.size });
    } catch (err) {
      console.error("[board/document] PDF 업로드 실패:", err);
      setError(t("uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const applySlides = () => {
    const embedUrl = toSlidesEmbedUrl(slidesInput);
    if (!embedUrl) {
      setError(t("invalidSlides"));
      return;
    }
    setError(null);
    onChange({ type: "GOOGLE_SLIDES", url: embedUrl, fileSize: null });
  };

  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${active ? "bg-black text-white" : "border border-gray-300 text-gray-700"}`;

  return (
    <section className="space-y-3 rounded-2xl border border-gray-200 p-5">
      <div>
        <h3 className="font-semibold">{t("heading")}</h3>
        <p className="mt-1 text-sm text-gray-500">{t("desc")}</p>
      </div>

      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-4 text-sm">
          <span className="flex min-w-0 items-center gap-2">
            {value.type === "PDF" ? <FileText size={18} /> : <Presentation size={18} />}
            <span className="truncate">
              {value.type === "PDF"
                ? `${fileName ?? t("pdfAttached")}${value.fileSize ? ` · ${(value.fileSize / 1024 / 1024).toFixed(1)}MB` : ""}`
                : t("slidesAttached")}
            </span>
          </span>
          <button type="button" onClick={() => onChange(null)} aria-label={t("remove")}
            className="shrink-0 text-gray-500 hover:text-red-500">
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2" role="tablist">
            <button type="button" role="tab" aria-selected={mode === "PDF"} onClick={() => setMode("PDF")} className={tabClass(mode === "PDF")}>
              <FileText size={14} /> {t("pdfTab")}
            </button>
            <button type="button" role="tab" aria-selected={mode === "GOOGLE_SLIDES"} onClick={() => setMode("GOOGLE_SLIDES")}
              className={tabClass(mode === "GOOGLE_SLIDES")}>
              <Presentation size={14} /> {t("slidesTab")}
            </button>
          </div>

          {mode === "PDF" ? (
            <div>
              <input ref={inputRef} type="file" accept={DOCUMENT_CONTENT_TYPE} onChange={handleFile} className="hidden" />
              <button type="button" onClick={() => inputRef.current?.click()} disabled={progress !== null}
                className="w-full rounded-xl border-2 border-dashed border-gray-300 p-6 text-sm text-gray-500 hover:border-gray-400 disabled:opacity-60">
                {progress !== null ? t("uploading", { percent: progress }) : t("pdfPick", { max: MAX_DOCUMENT_MB })}
              </button>
              <p className="mt-2 text-xs text-gray-400">{t("pdfHint")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input value={slidesInput} onChange={(e) => setSlidesInput(e.target.value)}
                  placeholder="https://docs.google.com/presentation/d/..."
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <button type="button" onClick={applySlides}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
                  {t("apply")}
                </button>
              </div>
              <p className="text-xs text-gray-400">{t("slidesHint")}</p>
            </div>
          )}
        </>
      )}

      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    </section>
  );
}
