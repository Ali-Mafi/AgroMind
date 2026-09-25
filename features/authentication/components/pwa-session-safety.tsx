"use client";
import { useEffect } from "react";
export function PwaSessionSafety() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const register = () => {
      // register() already checks for updates. Do not immediately request sw.js
      // again, and do not compete with the first document's critical resources.
      void navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .catch(() => {});
    };
    const schedule = () => {
      if ("requestIdleCallback" in window)
        idle = window.requestIdleCallback(register, { timeout: 3000 });
      else timer = setTimeout(register, 0);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      window.removeEventListener("load", schedule);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, []);
  return null;
}
