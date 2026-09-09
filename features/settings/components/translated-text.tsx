"use client";
import { useTranslation } from "../hooks/use-translation";
export function T({ text }: { text: string }) {
  const t = useTranslation();
  return <>{t(text)}</>;
}
