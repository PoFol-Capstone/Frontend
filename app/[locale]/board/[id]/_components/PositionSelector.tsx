import type { RecruitPositionResponse } from "@/types/post";
import { useTranslations } from "next-intl";

export default function PositionSelector({
  positions,
  selectedPosition,
  onSelect,
}: {
  positions: RecruitPositionResponse[];
  selectedPosition: string;
  onSelect: (p: string) => void;
}) {
  const t = useTranslations("board.apply");

  return (
    <div className="mb-4">
      <p className="mb-2 text-sm font-medium">{t("selectPosition")}</p>
      <div className="flex flex-wrap gap-2">
        {positions.map((pos) => {
          const isSelected = selectedPosition === pos.positionType;
          return (
            <button
              key={pos.positionType}
              type="button"
              disabled={pos.isFull}
              onClick={() => onSelect(pos.positionType)}
              className={`rounded-full border px-3 py-1 text-xs ${
                pos.isFull
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : isSelected
                    ? "border-black bg-black text-white"
                    : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              {pos.positionType} ({pos.currentCount}/{pos.maxCount})
            </button>
          );
        })}
      </div>
    </div>
  );
}
