import { parsePreferences } from "./preferences";
import type { Preferences } from "../types/preferences";

// Display preferences only: never include identity, farm data or credentials.
export const PREFERENCES_COOKIE = "agromind_display_v1";

export function preferencesFromCookie(value?: string): Preferences | undefined {
  if (!value || value.length > 3000) return undefined;
  try {
    const raw = decodeURIComponent(value);
    const data = JSON.parse(raw);
    if (!data || data.version !== 1) return undefined;
    return parsePreferences(raw);
  } catch {
    return undefined;
  }
}

export function displayPreferencesCookie(preferences: Preferences): string {
  // The shared parser allowlists every field and value before serialization.
  return encodeURIComponent(JSON.stringify(parsePreferences(JSON.stringify(preferences))));
}

export function readDisplayPreferences(): Preferences | undefined {
  if (typeof document === "undefined") return undefined;
  try {
    const prefix = `${PREFERENCES_COOKIE}=`;
    const entry = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
    return preferencesFromCookie(entry?.slice(prefix.length));
  } catch {
    return undefined;
  }
}

export function syncDisplayPreferences(preferences: Preferences): void {
  if (typeof document === "undefined") return;
  try {
    const value = displayPreferencesCookie(preferences);
    const prefix = `${PREFERENCES_COOKIE}=`;
    if (document.cookie.split(";").some((part) => part.trim() === prefix + value)) return;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${prefix}${value}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  } catch {
    // Storage restrictions must not prevent rendering or editing preferences.
  }
}
