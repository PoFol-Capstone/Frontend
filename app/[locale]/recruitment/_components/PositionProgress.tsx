"use client";

import type { RecruitPositionResponse } from "@/types/post";
import { usePositionLabel } from "./usePositionLabel";
import { fillPercent } from "./utils";

/** 포지션별 충원 현황 — 라벨, 수락 인원/정원, 진행바 */
export default function PositionProgress({
  position,
}: {
  position: RecruitPositionResponse;
}) {
  const positionLabel = usePositionLabel();
  const label = positionLabel(position.positionType);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold text-gray-700">{label}</span>
        <span className={position.isFull ? "font-semibold text-gray-950" : "text-gray-500"}>
          {position.currentCount}/{position.maxCount}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={position.maxCount}
        aria-valuenow={position.currentCount}
        className="h-1.5 overflow-hidden rounded-full bg-gray-200"
      >
        <div
          className={`h-full rounded-full transition-[width] ${position.isFull ? "bg-gray-950" : "bg-gray-500"}`}
          style={{ width: `${fillPercent(position.currentCount, position.maxCount)}%` }}
        />
      </div>
    </div>
  );
}
