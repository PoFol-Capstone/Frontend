"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Maximize2 } from "lucide-react";
import { isSlidesEmbedUrl } from "@/lib/slides";
import type { PostDocument } from "@/types/post";

const BLOB_HOST = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;

/**
 * 3.5 발표자료 뷰어. PDF는 브라우저 내장 뷰어(페이지 넘김·확대 제공)를, 슬라이드는 구글 embed를 iframe으로 띄운다.
 * 백엔드가 출처를 검증하지만, 렌더링 직전에 한 번 더 허용 형식만 띄운다 (임의 URL iframe 방지).
 */
export default function DocumentViewer({ document }: { document: PostDocument }) {
  const t = useTranslations("board.document");
  const frameRef = useRef<HTMLDivElement>(null);

  const allowed =
    document.type === "PDF" ? BLOB_HOST.test(document.url) : isSlidesEmbedUrl(document.url);
  if (!allowed) return null;

  const src = document.type === "PDF" ? `${document.url}#view=FitH` : `${document.url}?start=false&loop=false`;

  const fullscreen = () => {
    frameRef.current?.requestFullscreen?.().catch(() => {});
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{t("viewerHeading")}</h2>
        <div className="flex gap-3 text-sm">
          <button type="button" onClick={fullscreen} className="inline-flex items-center gap-1 text-gray-600 hover:text-black">
            <Maximize2 size={14} /> {t("fullscreen")}
          </button>
          {document.type === "PDF" && (
            <a href={document.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-gray-600 hover:text-black">
              <ExternalLink size={14} /> {t("openNewTab")}
            </a>
          )}
        </div>
      </div>
      <div ref={frameRef} className="aspect-video w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
        <iframe
          src={src}
          title={t("viewerHeading")}
          loading="lazy"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    </section>
  );
}
