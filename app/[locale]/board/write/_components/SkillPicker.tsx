"use client";

import type { Skill } from "@/types/skill";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface SkillPickerProps {
  selected: Skill[];
  onChange: (skills: Skill[]) => void;
}

export default function SkillPicker({ selected, onChange }: SkillPickerProps) {
  const t = useTranslations("board.write.skillPicker");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Skill[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  // selected를 deps에 넣으면 스킬을 고를 때마다 search 아이덴티티가 바뀌어
  // 아래 useEffect가 다시 실행되고, 방금 받은 결과가 로딩 상태로 잠깐씩 지워지길
  // 반복했다(연달아 고를수록 두 번째 선택부터 목록이 안 보이는 것처럼 보였음).
  // ref로 최신값만 읽어서 search 아이덴티티를 선택 여부와 무관하게 유지한다.
  const search = useCallback(async (q: string) => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    try {
      const url = q ? `/api/skills?q=${encodeURIComponent(q)}` : "/api/skills";
      const res = await fetch(url);
      const data: Skill[] = await res.json();
      if (requestId !== requestIdRef.current) return;
      setResults(
        data.filter((s) => !selectedRef.current.some((sel) => sel.id === s.id)),
      );
    } catch {
      if (requestId !== requestIdRef.current) return;
      setResults([]);
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, []);

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
    const next = selected.filter((s) => s.id !== id);
    onChange(next);
    // search()가 selectedRef를 바로 읽으므로, 다음 렌더를 기다리지 않고 먼저 갱신해둔다.
    selectedRef.current = next;
    if (isOpen) search(query);
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
              aria-label={t("removeLabel", { name: skill.name })}
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
          placeholder={selected.length === 0 ? t("placeholder") : ""}
          className="flex-1 min-w-30 text-sm outline-none bg-transparent placeholder:text-gray-400"
        />
      </div>

      {isOpen && (
        <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-400">{t("searching")}</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">{t("noResults")}</div>
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
