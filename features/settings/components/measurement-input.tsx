"use client";
import { useState, type InputHTMLAttributes } from "react";
import { useSettings } from "../context/settings-context";
import type { Units } from "../types/preferences";

/** The parent always owns a canonical value. A local draft preserves decimal typing. */
export function MeasurementInput({ kind, value, onValueChange, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  kind: keyof Units; value: number | string; onValueChange: (canonical: string) => void;
}) {
  const { format, units } = useSettings();
  const [draft, setDraft] = useState<{ raw: string; canonical: string; unit: string } | null>(null);
  const canonical = String(value);
  const display = draft?.unit === units[kind] && draft.canonical === canonical
    ? draft.raw : canonical === "" ? "" : format.input(Number(canonical), kind);
  return <input {...props} type="number" step={props.step ?? "any"} value={display} dir="ltr"
    onChange={(event) => {
      const raw = event.target.value;
      const next = raw === "" ? "" : String(format.parse(raw, kind));
      setDraft({ raw, canonical: next, unit: units[kind] });
      onValueChange(next);
    }} />;
}
