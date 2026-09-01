"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * 모달 공통 접근성 동작을 한 곳에 모은 훅.
 *
 * - ESC로 닫기
 * - Tab / Shift+Tab이 모달 밖으로 나가지 않게 포커스 트랩
 * - 열릴 때 모달 내부 첫 요소로 포커스 이동, 닫을 때 원래 요소로 복귀
 * - 배경 스크롤 잠금
 *
 * 반환한 ref를 모달 패널(`role="dialog"`를 붙일 요소)에 연결해서 사용한다.
 *
 * @param onClose ESC를 눌렀을 때 호출될 닫기 핸들러
 */
export function useModalA11y<T extends HTMLElement = HTMLDivElement>(
  onClose: () => void,
) {
  const panelRef = useRef<T>(null);
  // onClose가 렌더마다 새로 만들어지는 인라인 함수여도 아래 effect가 재실행되지 않도록 ref에 담아둔다.
  // 렌더 중에 ref를 쓰면 react-hooks/refs 룰에 걸리므로 동기화도 effect에서 한다.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      ).filter((el) => el.offsetParent !== null);

    // 열리자마자 모달 안으로 포커스를 옮겨서 키보드 사용자가 배경에 갇히지 않게 한다
    (focusables()[0] ?? panelRef.current)?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || !panelRef.current?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return panelRef;
}
