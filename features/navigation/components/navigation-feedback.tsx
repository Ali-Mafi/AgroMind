"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export const NAVIGATION_INTENT_KEY = "agromind-navigation-intent-v1";

export type NavigationIntent = {
  from: string;
  to: string;
  at: number;
};

function internalPath(url: URL) {
  return `${url.pathname}${url.search}${url.hash}`;
}

export function NavigationFeedback() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setPending(false);
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;

      const from = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const to = internalPath(destination);
      if (from === to) return;

      const intent: NavigationIntent = { from, to, at: Date.now() };
      try {
        window.sessionStorage.setItem(NAVIGATION_INTENT_KEY, JSON.stringify(intent));
      } catch {
        // Navigation still works when session storage is unavailable.
      }

      setPending(true);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setPending(false), 8000);
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!pending) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-0.5 overflow-hidden bg-primary/15"
    >
      <div className="h-full w-2/3 animate-pulse bg-primary motion-reduce:animate-none" />
    </div>
  );
}
