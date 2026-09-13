"use client";
import { useEffect } from "react";
export function PwaSessionSafety() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((registration) => registration.update())
        .catch(() => {});
    }
  }, []);
  return null;
}
