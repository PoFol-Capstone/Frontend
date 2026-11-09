"use client";
import { Database, Link, PenTool, GitBranch, Paperclip } from "lucide-react";
import { useTranslations } from "next-intl";
import Section from "@/components/ui/Section";

export type UploadSectionId = "erd" | "figma" | "class" | "extra";

const LINK_ROWS: {
  id: UploadSectionId;
  labelKey: string;
  icon: React.ElementType;
  placeholder: string;
}[] = [
  { id: "figma", labelKey: "figma", icon: PenTool, placeholder: "https://figma.com/..." },
  { id: "erd", labelKey: "erd", icon: Database, placeholder: "https://..." },
  { id: "class", labelKey: "class", icon: GitBranch, placeholder: "https://..." },
  { id: "extra", labelKey: "extra", icon: Paperclip, placeholder: "https://..." },
];

type Props = {
  uploadLinks: Record<UploadSectionId, string>;
  onChange: (id: UploadSectionId, url: string) => void;
  githubUrl?: string;
};

export default function UploadLinksSection({ uploadLinks, onChange, githubUrl }: Props) {
  const t = useTranslations("board.write.uploadLinks");

  return (
    <Section title={t("title")} description={t("hint")} card>

      <div className="space-y-4">
        {/* GitHub — 2단계에서 선택한 레포 기반 읽기 전용 */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100">
            <Link size={16} className="text-gray-600" />
          </div>
          <div className="flex-1">
            <input
              type="url"
              value={githubUrl ?? ""}
              readOnly
              placeholder={t("githubPlaceholder")}
              className="input bg-gray-50 text-gray-500 cursor-default"
            />
          </div>
        </div>

        {LINK_ROWS.map(({ id, icon: Icon, placeholder }) => (
          <div key={id} className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100">
              <Icon size={16} className="text-gray-600" />
            </div>
            <div className="flex-1 relative">
              <input
                type="url"
                value={uploadLinks[id]}
                onChange={(e) => onChange(id, e.target.value)}
                placeholder={placeholder}
                className="input pr-10"
              />
              {uploadLinks[id] && (
                <button
                  type="button"
                  onClick={() => onChange(id, "")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {LINK_ROWS.map(({ id, labelKey }) =>
          uploadLinks[id] ? (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600"
            >
              {t(labelKey)} ✓
            </span>
          ) : null
        )}
      </div>
    </Section>
  );
}
