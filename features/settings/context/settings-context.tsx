"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { resolvePreferences } from "../lib/preferences";
import { createFormatters } from "../lib/units";
import { getPreferencesSnapshot, subscribeToPreferences, updatePreferences, SERVER_SNAPSHOT } from "../lib/preferences-store";
import type { AreaUnit, Preferences, ResolvedPreferences, Units } from "../types/preferences";

export type { AreaUnit } from "../types/preferences";
type SettingsContextValue = ResolvedPreferences & {
  preferences: Preferences; isHydrated: boolean; saved: boolean;
  format: ReturnType<typeof createFormatters>;
  update: typeof updatePreferences;
  setUnit: <K extends keyof Units>(kind: K, unit: Units[K] | "auto") => void;
  areaUnit: AreaUnit; setAreaUnit: (unit: AreaUnit) => void;
};
const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);
const emptySubscribe = () => () => {};
const getServerSnapshot = () => SERVER_SNAPSHOT;
const setUnit: SettingsContextValue["setUnit"] = (kind, unit) => updatePreferences((previous) => ({ ...previous, units: { ...previous.units, [kind]: unit } }));

export function SettingsProvider({ children, initialPreferences }: { children: ReactNode; initialPreferences?: Preferences }) {
  const snapshot = useSyncExternalStore(subscribeToPreferences, getPreferencesSnapshot, getServerSnapshot);
  const isHydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const preferences = initialPreferences ?? snapshot.preferences;
  const value = useMemo(() => {
    const resolved = resolvePreferences(preferences);
    return { ...resolved, preferences, isHydrated, saved: snapshot.saved, format: createFormatters(resolved), update: updatePreferences, setUnit,
      areaUnit: resolved.units.area, setAreaUnit: (unit: AreaUnit) => setUnit("area", unit) };
  }, [preferences, isHydrated, snapshot.saved]);
  useEffect(() => {
    document.documentElement.lang = value.language;
    document.documentElement.dir = value.direction;
  }, [value.language, value.direction]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used inside SettingsProvider");
  return context;
}
