"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";

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
    <section className="border border-gray-200 rounded-2xl p-6 space-y-3 bg-white">
      <div>
        <h2 className="text-base font-semibold">{t("title")}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{t("hint")}</p>
      </div>

      <div className="flex flex-wrap gap-2 min-h-10 rounded-lg border border-gray-300 px-3 py-2 focus-within:ring-2 focus-within:ring-gray-200">
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
          className="flex-1 min-w-24 text-sm outline-none bg-transparent placeholder:text-gray-400"
        />
      </div>
    </section>
  );
}
