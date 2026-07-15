"use client";

import type { Skill } from "@/types/skill";
import { useCallback, useEffect, useRef, useState } from "react";

interface SkillPickerProps {
  selected: Skill[];
  onChange: (skills: Skill[]) => void;
}

export default function SkillPicker({ selected, onChange }: SkillPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Skill[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    async (q: string) => {
      setIsLoading(true);
      try {
        const url = q
          ? `/api/skills?q=${encodeURIComponent(q)}`
          : "/api/skills";
        const res = await fetch(url);
        const data: Skill[] = await res.json();
        setResults(
          data.filter((s) => !selected.some((sel) => sel.id === s.id)),
        );
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [selected],
  );

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isOpen, search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addSkill = (skill: Skill) => {
    onChange([...selected, skill]);
    setQuery("");
    setResults((prev) => prev.filter((s) => s.id !== skill.id));
    inputRef.current?.focus();
  };

  const removeSkill = (id: number) => {
    onChange(selected.filter((s) => s.id !== id));
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex flex-wrap gap-2 min-h-10.5 w-full border border-gray-300 rounded-lg px-3 py-2 cursor-text focus-within:border-black"
        onClick={() => {
          inputRef.current?.focus();
          setIsOpen(true);
        }}
      >
        {selected.map((skill) => (
          <span
            key={skill.id}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700"
          >
            {skill.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeSkill(skill.id);
              }}
              className="ml-0.5 opacity-70 hover:opacity-100 text-base leading-none"
              aria-label={`${skill.name} 제거`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={selected.length === 0 ? "기술 스택 검색..." : ""}
          className="flex-1 min-w-30 text-sm outline-none bg-transparent placeholder:text-gray-400"
        />
      </div>

      {isOpen && (
        <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-400">검색 중...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">결과 없음</div>
          ) : (
            results.map((skill) => (
              <button
                key={skill.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addSkill(skill);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 text-left"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: skill.badgeColor }}
                />
                {skill.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
