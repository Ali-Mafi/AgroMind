import { DEFAULT_PREFERENCES, parsePreferences } from "./preferences";
import type { Preferences } from "../types/preferences";
import { readDisplayPreferences, syncDisplayPreferences } from "./preferences-cookie";

export const PREFERENCES_KEY = "agromind-preferences-v1";
export const SERVER_SNAPSHOT = { preferences: DEFAULT_PREFERENCES, saved: true };
let snapshot = SERVER_SNAPSHOT;
let loaded = false;
const listeners = new Set<() => void>();
export function getPreferencesSnapshot() {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    try {
      const raw = localStorage.getItem(PREFERENCES_KEY);
      snapshot = { preferences: raw ? parsePreferences(raw) : readDisplayPreferences() ?? parsePreferences(null, localStorage.getItem("agromind-region"), localStorage.getItem("agromind-region-source")), saved: true };
    }
    catch { snapshot = { preferences: readDisplayPreferences() ?? DEFAULT_PREFERENCES, saved: false }; }
  }
  return snapshot;
}
export function updatePreferences(change: Partial<Preferences> | ((previous: Preferences) => Preferences)) {
  const previous = getPreferencesSnapshot().preferences;
  const preferences = typeof change === "function" ? change(previous) : { ...previous, ...change };
  let saved = true;
  try { localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences)); } catch { saved = false; }
  syncDisplayPreferences(preferences);
  snapshot = { preferences, saved }; listeners.forEach((listener) => listener());
}
export function subscribeToPreferences(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== PREFERENCES_KEY) return;
    snapshot = { preferences: parsePreferences(event.newValue), saved: true };
    syncDisplayPreferences(snapshot.preferences);
    listeners.forEach((notify) => notify());
  };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); };
}
