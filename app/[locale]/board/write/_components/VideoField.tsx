"use client";
import { useTranslations } from "next-intl";
import Field from "@/components/ui/Field";
import { toVideoEmbedUrl } from "@/lib/video";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

/**
 * 데모 영상 링크 입력 + 미리보기 + 올리는 방법 가이드. 작성 · 수정 화면 공용.
 * 공개 범위(비공개 · 제한됨)는 서버에서 알 수 없으므로 미리보기로 사용자가 직접 확인하게 한다.
 */
export default function VideoField({ value, onChange }: Props) {
  const t = useTranslations("board.video");
  const embedUrl = value.trim() ? toVideoEmbedUrl(value) : null;
  const invalid = !!value.trim() && !embedUrl;

  return (
    <Field label={t("label")}>
      <div className="space-y-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://youtu.be/..."
          aria-invalid={invalid}
          className="input"
        />
        {invalid && <p className="text-xs text-red-500">{t("invalid")}</p>}

        {embedUrl && (
          <>
            <div className="aspect-video w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              <iframe src={embedUrl} title={t("label")} loading="lazy" allowFullScreen className="h-full w-full" />
            </div>
            <p className="text-xs text-gray-500">{t("previewHint")}</p>
          </>
        )}

        <details className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <summary className="cursor-pointer font-medium text-gray-800">{t("guide.title")}</summary>
          <div className="mt-3 space-y-3">
            <div>
              <p className="font-semibold text-gray-800">{t("guide.youtubeTitle")}</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5">
                <li>{t("guide.youtube1")}</li>
                <li>{t("guide.youtube2")}</li>
                <li>{t("guide.youtube3")}</li>
                <li>{t("guide.youtube4")}</li>
              </ol>
            </div>
            <div>
              <p className="font-semibold text-gray-800">{t("guide.driveTitle")}</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5">
                <li>{t("guide.drive1")}</li>
                <li>{t("guide.drive2")}</li>
                <li>{t("guide.drive3")}</li>
              </ol>
            </div>
            <p className="text-xs text-gray-500">{t("guide.tip")}</p>
          </div>
        </details>
      </div>
    </Field>
  );
}
