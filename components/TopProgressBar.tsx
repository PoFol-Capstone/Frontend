"use client";

import { useEffect, useState } from "react";

export default function TopProgressBar({ active }: { active: boolean }) {
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (active) {
      timers.push(
        setTimeout(() => {
          setVisible(true);
          setWidth(15);
        }, 0),
      );

      const interval = setInterval(() => {
        setWidth((w) => (w >= 90 ? w : w + (90 - w) * 0.1));
      }, 200);

      return () => {
        timers.forEach(clearTimeout);
        clearInterval(interval);
      };
    }

    timers.push(
      setTimeout(() => setWidth(100), 0),
      setTimeout(() => setVisible(false), 200),
      setTimeout(() => setWidth(0), 500),
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [active]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-100 h-0.75 bg-gray-900 transition-[width,opacity] duration-200 ease-out"
      style={{ width: `${width}%`, opacity: visible ? 1 : 0 }}
    />
  );
}
