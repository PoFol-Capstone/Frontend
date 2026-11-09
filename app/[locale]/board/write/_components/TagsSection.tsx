"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import Section from "@/components/ui/Section";

type Props = {
  tags: string[];
  onChange: (tags: string[]) => void;
};

export default function TagsSection({ tags, onChange }: Props) {
  const t = useTranslations("board.write.tags");
  const [tagInput, setTagInput] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().replace(/,$/, "");
      if (tag && !tags.includes(tag)) onChange([...tags, tag]);
      setTagInput("");
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <Section title={t("title")} description={t("hint")} card>

      <div className="flex flex-wrap items-center gap-2 min-h-12 rounded-xl border border-gray-200 bg-white px-4 py-2 focus-within:border-gray-900 focus-within:ring-4 focus-within:ring-gray-900/5 transition">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="text-gray-400 hover:text-gray-700 leading-none"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? t("placeholder") : ""}
          className="flex-1 min-w-24 text-[15px] outline-none bg-transparent placeholder:text-gray-400"
        />
      </div>
    </Section>
  );
}
