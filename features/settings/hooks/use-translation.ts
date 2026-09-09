"use client";
import { useMemo } from "react";
import { useSettings } from "../context/settings-context";
import { translator } from "../lib/translation";
export function useTranslation() {
  const { language } = useSettings();
  return useMemo(() => translator(language), [language]);
}
