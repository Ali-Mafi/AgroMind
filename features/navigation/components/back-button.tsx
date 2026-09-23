"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NavigationArrow } from "@/components/ui/navigation-arrow";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { navigateBack, NAVIGATION_COMPLETE } from "../lib/history";

export function BackButton({
  className = "",
  fallback,
  onClick,
}: {
  className?: string;
  fallback?: string;
  onClick?: () => void;
}) {
  const router = useRouter();
  const t = useTranslation();
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const done = () => {
      inFlight.current = false;
      setBusy(false);
      if (timeout.current) clearTimeout(timeout.current);
    };
    window.addEventListener(NAVIGATION_COMPLETE, done);
    return () => {
      window.removeEventListener(NAVIGATION_COMPLETE, done);
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);
  return (
    <button
      type="button"
      disabled={busy}
      aria-label={t("Back")}
      title={t("Back")}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-current/15 transition-colors hover:bg-muted/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current disabled:opacity-50 ${className}`}
      onClick={() => {
        if (onClick) {
          onClick();
          return;
        }
        if (inFlight.current) return;
        inFlight.current = true;
        setBusy(true);
        timeout.current = setTimeout(() => {
          inFlight.current = false;
          setBusy(false);
        }, 8000);
        navigateBack(router, fallback);
      }}
    >
      <NavigationArrow toward="back" size={20} />
    </button>
  );
}
