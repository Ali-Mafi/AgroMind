"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1 rounded-xl border bg-card p-1">
        <div className="h-8 w-8 rounded-lg" />
        <div className="h-8 w-8 rounded-lg" />
        <div className="h-8 w-8 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-xl border bg-card p-1">
      <button
        type="button"
        onClick={() => setTheme("light")}
        aria-label="Light mode"
        className={`rounded-lg p-2 transition-colors ${
          theme === "light"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        }`}
      >
        <Sun className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => setTheme("system")}
        aria-label="System theme"
        className={`rounded-lg p-2 transition-colors ${
          theme === "system"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        }`}
      >
        <Monitor className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-label="Dark mode"
        className={`rounded-lg p-2 transition-colors ${
          theme === "dark"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        }`}
      >
        <Moon className="h-4 w-4" />
      </button>
    </div>
  );
}