import type { Preferences } from "../types/preferences";
import { resolvePreferences } from "./preferences";

export function preferencesFromProfile(
  previous: Preferences,
  country: string,
  language: string,
): Preferences {
  const next = { ...previous, country, regionConfirmed: true };
  const resolvedLanguage = language === "fa" ? "fa" : "en";
  return {
    ...next,
    language: previous.language === "auto" && resolvePreferences(next).language === resolvedLanguage
      ? "auto"
      : resolvedLanguage,
  };
}
