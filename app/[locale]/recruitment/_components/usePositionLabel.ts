"use client";

import { useTranslations } from "next-intl";
import { isKnownPosition } from "./utils";

/** 백엔드 PositionType(FRONTEND 등)을 화면 라벨로 — 예전엔 원문 그대로 노출됐다 */
export function usePositionLabel() {
  const t = useTranslations("recruitment.positions");
  return (type: string) => (isKnownPosition(type) ? t(type) : type);
}
