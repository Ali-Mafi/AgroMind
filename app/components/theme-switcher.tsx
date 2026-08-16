"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Monitor, Moon, Sun } from "lucide-react";

const themes = [
  {
    value: "light",
    label: "Light",
    icon: Sun,
  },
  {
    value: "system",
    label: "System",
    icon: Monitor,
  },
  {
    value: "dark",
    label: "Dark",
    icon: Moon,
  },
] as const;

type ThemeValue = (typeof themes)[number]["value"];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [activeTheme, setActiveTheme] =
    useState<ThemeValue>("system");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (
      theme === "light" ||
      theme === "system" ||
      theme === "dark"
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTheme(theme);
    }
  }, [theme]);

  if (!mounted) {
    return (
      <div className="grid h-12 w-full max-w-md grid-cols-3 gap-1 rounded-2xl border bg-muted/40 p-1">
        {themes.map((item) => (
          <div
            key={item.value}
            className="flex h-10 items-center justify-center gap-2 rounded-xl"
          >
            <div className="h-4 w-4 rounded-full bg-muted" />

            <div className="hidden h-3 w-12 rounded bg-muted sm:block" />
          </div>
        ))}
      </div>
    );
  }

  const activeIndex = Math.max(
    themes.findIndex((item) => item.value === activeTheme),
    0,
  );

  const handleThemeChange = (value: ThemeValue) => {
    setActiveTheme(value);
    setTheme(value);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="grid h-14 w-full max-w-md grid-cols-3 gap-1.5 rounded-2xl border bg-muted/40 p-1.5"
    >
      {/* Sliding selector */}
      <motion.div
        layout
        layoutId="theme-selector"
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 35,
          mass: 0.7,
        }}
        className="pointer-events-none absolute"
      />

      {themes.map((item, index) => {
        const Icon = item.icon;
        const selected = index === activeIndex;

        return (
          <button
            key={item.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${item.label} theme`}
            onClick={() => handleThemeChange(item.value)}
            className="relative z-10 flex h-10 min-w-0 items-center justify-center rounded-xl px-2 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 sm:px-3"
          >
            {selected && (
              <motion.div
                layoutId="active-theme-background"
                className="absolute inset-0 rounded-xl bg-background shadow-sm ring-1 ring-border/60"
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                  mass: 0.7,
                }}
              />
            )}

            <motion.span
              layout
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 35,
              }}
              className={`relative z-10 flex min-w-0 items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ${
                selected
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <motion.span
                animate={{
                  scale: selected ? 1.08 : 1,
                  rotate: selected ? 0 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 25,
                }}
              >
                <Icon className="h-4 w-4 shrink-0" />
              </motion.span>

              <span className="hidden sm:inline">
                {item.label}
              </span>
            </motion.span>
          </button>
        );
      })}
    </div>
  );
}