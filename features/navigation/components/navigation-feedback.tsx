"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import {
  installHistoryTracking,
  NAVIGATION_COMPLETE,
  NAVIGATION_START,
} from "../lib/history";

export function NavigationFeedback() {
  const pathname = usePathname();
  const t = useTranslation();
  const [pending, setPending] = useState(false);
  const destination = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // Route completion also clears feedback if Next replaces a history method.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPending(false);
    destination.current = "";
  }, [pathname]);
  useEffect(() => {
    const uninstall = installHistoryTracking(window);
    const done = () => {
      destination.current = "";
      setPending(false);
      if (timer.current) clearTimeout(timer.current);
    };
    const start = () => {
      setPending(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(done, 8000);
    };
    const click = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      )
        return;
      const link = event.target.closest("a[href]");
      if (
        !(link instanceof HTMLAnchorElement) ||
        (link.target && link.target !== "_self") ||
        link.hasAttribute("download")
      )
        return;
      const next = new URL(link.href, window.location.href);
      if (
        next.origin !== window.location.origin ||
        (next.pathname === window.location.pathname &&
          next.search === window.location.search)
      )
        return;
      if (destination.current === next.href) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      destination.current = next.href;
      start();
    };
    document.addEventListener("click", click, true);
    window.addEventListener(NAVIGATION_START, start);
    window.addEventListener(NAVIGATION_COMPLETE, done);
    return () => {
      uninstall();
      document.removeEventListener("click", click, true);
      window.removeEventListener(NAVIGATION_START, start);
      window.removeEventListener(NAVIGATION_COMPLETE, done);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  return pending ? (
    <>
      <div role="status" className="sr-only">
        {t("Opening page…")}
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-0.5 overflow-hidden bg-primary/15"
      >
        <div className="h-full w-2/3 animate-pulse bg-primary motion-reduce:animate-none" />
      </div>
    </>
  ) : null;
}
