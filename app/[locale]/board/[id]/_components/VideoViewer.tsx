"use client";

import { useTranslations } from "next-intl";
import { isVideoEmbedUrl } from "@/lib/video";

/** 데모 영상 임베드. 백엔드가 형식을 검증하지만 렌더링 직전에 한 번 더 허용 형식만 띄운다 (임의 URL iframe 방지). */
export default function VideoViewer({ url }: { url: string }) {
  const t = useTranslations("board.video");
  if (!isVideoEmbedUrl(url)) return null;

  return (
    <section className="mb-8 space-y-3">
      <h2 className="text-lg font-bold">{t("heading")}</h2>
      <div className="aspect-video w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
        <iframe
          src={url}
          title={t("heading")}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    </section>
  );
}
