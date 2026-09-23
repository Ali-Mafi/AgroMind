"use client";

import { useEffect, useId, useState } from "react";
import { useTheme } from "next-themes";
import { motion, useReducedMotion } from "framer-motion";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { useSettings } from "@/features/settings/context/settings-context";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

export function ThemeSwitcher() {
  const t = useTranslation();
  const { direction } = useSettings();
  const { theme, setTheme } = useTheme();
  const reduced = useReducedMotion();
  const id = useId();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  if (!mounted)
    return (
      <div
        className="h-14 w-full max-w-md rounded-2xl border bg-muted/40"
        aria-hidden="true"
      />
    );
  const selectedIndex = Math.max(
    0,
    themes.findIndex((item) => item.value === theme),
  );
  return (
    <div
      role="radiogroup"
      aria-label={t("Theme")}
      className="app-theme-surface grid min-h-14 w-full max-w-md grid-cols-3 gap-1.5 rounded-2xl border bg-muted/40 p-1.5"
    >
      {themes.map((item, index) => {
        const Icon = item.icon;
        const selected = index === selectedIndex;
        return (
          <button
            key={item.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            aria-label={t("{theme} theme", { theme: t(item.label) })}
            onClick={() => setTheme(item.value)}
            onKeyDown={(event) => {
              const delta =
                event.key === "ArrowRight"
                  ? direction === "rtl"
                    ? -1
                    : 1
                  : event.key === "ArrowLeft"
                    ? direction === "rtl"
                      ? 1
                      : -1
                    : event.key === "ArrowDown"
                      ? 1
                      : event.key === "ArrowUp"
                        ? -1
                        : 0;
              if (!delta && event.key !== "Home" && event.key !== "End") return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? themes.length - 1
                    : (index + delta + themes.length) % themes.length;
              setTheme(themes[next].value);
              event.currentTarget.parentElement
                ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
                [next]?.focus();
            }}
            className="relative flex min-h-11 min-w-0 items-center justify-center rounded-xl px-2 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 sm:px-3"
          >
            {selected && (
              <motion.span
                layoutId={`${id}-active-theme`}
                className="app-theme-fill pointer-events-none absolute inset-0 rounded-xl bg-background shadow-sm ring-1 ring-border/60"
                transition={
                  reduced
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 500, damping: 35, mass: 0.7 }
                }
              />
            )}
            <span
              className={`relative flex min-w-0 items-center justify-center gap-2 text-sm font-medium ${selected ? "text-foreground" : "text-muted-foreground"}`}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">{t(item.label)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
