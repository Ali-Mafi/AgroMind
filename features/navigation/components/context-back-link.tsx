"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import {
  NAVIGATION_INTENT_KEY,
  type NavigationIntent,
} from "./navigation-feedback";

function safeInternalPath(value: string | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const parsed = new URL(value, "https://agromind.local");
    if (parsed.origin !== "https://agromind.local") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

function destinationLabel(path: string) {
  if (path.startsWith("/weather")) return "Back to Weather";
  if (path.startsWith("/irrigation")) return "Back to Irrigation";
  if (path.startsWith("/dashboard")) return "Back to Dashboard";
  if (path.startsWith("/settings")) return "Back to Settings";
  if (path.startsWith("/account")) return "Back to Account";
  return "Back to Farms";
}

export function ContextBackLink({ fallback = "/farms" }: { fallback?: string }) {
  const pathname = usePathname();
  const t = useTranslation();
  const [target, setTarget] = useState(fallback);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(NAVIGATION_INTENT_KEY);
      if (!raw) return;
      const intent = JSON.parse(raw) as NavigationIntent;
      const destination = new URL(intent.to, window.location.origin);
      const isCurrentDestination = destination.pathname === pathname;
      const isRecent = Date.now() - intent.at < 10 * 60 * 1000;
      if (!isCurrentDestination || !isRecent) return;
      // The source route is only available in the browser after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTarget(safeInternalPath(intent.from, fallback));
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTarget(fallback);
    }
  }, [fallback, pathname]);

  return (
    <Link
      href={target}
      className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
      {t(destinationLabel(target))}
    </Link>
  );
}
