"use client";

import { useEffect, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { ThemeProvider as NextThemesProvider } from "next-themes";

function ThemeMotionReady() {
  useEffect(() => {
    // Let next-themes apply the initial system/stored theme before enabling color transitions.
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        document.documentElement.dataset.themeReady = "true";
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      delete document.documentElement.dataset.themeReady;
    };
  }, []);
  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemeMotionReady />
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </NextThemesProvider>
  );
}
