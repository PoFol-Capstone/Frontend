"use client";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { MAX_ROLE_COUNT, RECRUIT_ROLES } from "@/lib/recruitPositions";

type Props = {
  enabled: boolean;
  /** hideToggle이면 쓰지 않는다 (작성 1단계, 유형을 바꿀 수 없는 수정 화면) */
  onEnabledChange?: (v: boolean) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  roleCounts: Record<string, number>;
  onRoleCountsChange: (roleCounts: Record<string, number>) => void;
  hideToggle?: boolean;
  /** 포지션 검사 실패 메시지 — 포지션 선택 영역 아래에 보여준다 */
  positionsError?: string | null;
};

export default function TeamRecruitSection({
  enabled,
  onEnabledChange,
  description,
  onDescriptionChange,
  roleCounts,
  onRoleCountsChange,
  hideToggle = false,
  positionsError = null,
}: Props) {
  const t = useTranslations("board.write.teamRecruit");
  const recruitRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = recruitRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [description]);

  const toggleRole = (role: string) => {
    if (role in roleCounts) {
      const next = { ...roleCounts };
      delete next[role];
      onRoleCountsChange(next);
    } else {
      onRoleCountsChange({ ...roleCounts, [role]: 1 });
    }
  };

  const updateCount = (role: string, value: number) => {
    if (value < 1 || value > MAX_ROLE_COUNT) return;
    onRoleCountsChange({ ...roleCounts, [role]: value });
  };

  return (
    <section className="border border-gray-200 rounded-2xl p-6 space-y-4 bg-white">
      {!hideToggle && (
        <div>
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="teamRecruit"
              checked={enabled}
              onChange={(e) => onEnabledChange?.(e.target.checked)}
              className="w-5 h-5 rounded accent-black cursor-pointer"
            />
            <label htmlFor="teamRecruit" className="text-base font-semibold cursor-pointer">
              {t("title")}
            </label>
          </div>
          <p className="text-sm text-gray-500 mt-1.5 pl-7">
            {t("hint")}
          </p>
        </div>
      )}

      {(enabled || hideToggle) && (
        <div className={`space-y-4 ${!hideToggle ? "border-t border-gray-200 pt-4" : ""}`}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t("description")}</label>
            <textarea
              ref={recruitRef}
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              rows={1}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none overflow-hidden placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("roles")}</label>
            <div className="flex flex-wrap gap-3">
              {RECRUIT_ROLES.map((role) => {
                const isSelected = role in roleCounts;
                return (
                  <div key={role} className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleRole(role)}
                      aria-pressed={isSelected}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        isSelected
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {role}
                    </button>
                    {isSelected && (
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateCount(role, roleCounts[role] - 1)}
                          aria-label={t("decrease", { role })}
                          className="px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          -
                        </button>
                        <span className="px-2 py-1.5 text-sm min-w-8 text-center select-none">
                          {roleCounts[role]}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCount(role, roleCounts[role] + 1)}
                          aria-label={t("increase", { role })}
                          className="px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    )}
                    {isSelected && t("unit") && (
                      <span className="text-sm text-gray-500">{t("unit")}</span>
                    )}
                  </div>
                );
              })}
            </div>
            {positionsError && (
              <p role="alert" className="text-sm text-red-500">
                {positionsError}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
