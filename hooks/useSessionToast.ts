"use client";

import { useEffect, useState } from "react";

const AUTO_DISMISS_MS = 2500;

// Reads a one-shot message left in sessionStorage (e.g. by another page right
// before a redirect/reload), shows it once, then clears the storage key so it
// never reappears. sessionStorage doesn't exist during SSR and can't be read
// during render, so this has to be an effect — there's no derivable-render or
// lazy-initializer alternative that stays SSR/hydration-safe.
export function useSessionToast(key: string) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem(key);
    if (!saved) return;
    sessionStorage.removeItem(key);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above
    setMessage(saved);
  }, [key]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [message]);

  return message;
}
