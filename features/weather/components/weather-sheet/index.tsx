"use client";

import { useTranslation } from "@/features/settings/hooks/use-translation";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { mountWeatherSheet } from "@/features/weather/lib/weather-sheet-lifecycle";
import styles from "../weather-experience/weather-experience.module.css";

export function WeatherSheet({ title, subtitle, onClose, children }: {
  title: string; subtitle?: string; onClose: () => void; children: ReactNode;
}) {
  const t = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const lifecycle = useRef<ReturnType<typeof mountWeatherSheet> | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const mounted = mountWeatherSheet(dialog, onClose);
    lifecycle.current = mounted;
    return () => {
      lifecycle.current = null;
      mounted.dispose();
    };
  }, [onClose]);
  const close = () => lifecycle.current?.close();

  return (
    <dialog ref={ref} className={styles.sheet} aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className={styles.sheetInner}>
        <header className={styles.sheetHeader}>
          <div><h2 id={titleId}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
          <button type="button" className={styles.iconButton} onClick={close} aria-label={t("Close details")} autoFocus><X size={22} /></button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
