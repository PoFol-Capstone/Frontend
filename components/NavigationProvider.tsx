"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useTransition } from "react";
import TopProgressBar from "./TopProgressBar";

type NavigationContextValue = {
  navigate: (href: string, options?: { scroll?: boolean }) => void;
  startNavigation: (fn: () => void | Promise<void>) => void;
  handleLinkClick: (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const startNavigation = (fn: () => void | Promise<void>) => {
    startTransition(fn);
  };

  const navigate = (href: string, options?: { scroll?: boolean }) => {
    startNavigation(() => router.push(href, options));
  };

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (
      e.defaultPrevented ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.button !== 0
    ) {
      return;
    }
    e.preventDefault();
    navigate(href);
  };

  return (
    <NavigationContext.Provider
      value={{ navigate, startNavigation, handleLinkClick }}
    >
      <TopProgressBar active={isPending} />
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
}
