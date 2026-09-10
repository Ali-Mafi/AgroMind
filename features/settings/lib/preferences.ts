import { REGION_PROFILES, UNIT_OPTIONS } from "../constants/region-profiles";
import { CALENDAR_OPTIONS, LANGUAGE_OPTIONS, RTL_LANGUAGES } from "../constants/locale-options";
import type { Country, Preferences, ResolvedPreferences, UnitOverrides, Units } from "../types/preferences";

export const AUTO_UNITS: UnitOverrides = { temperature: "auto", area: "auto", gardenArea: "auto", distance: "auto", length: "auto", wind: "auto", precipitation: "auto", volume: "auto", pressure: "auto" };
export const DEFAULT_PREFERENCES: Preferences = { version: 1, country: "US", regionConfirmed: false, regionSource: "detected", language: "auto", units: AUTO_UNITS, calendar: "auto", hourCycle: "auto" };
export function countryFromLocale(value: string | null | undefined): Country | null {
  if (!value) return null;
  const code = value.split(/[-_]/).at(-1)?.toUpperCase();
  return code && Object.hasOwn(REGION_PROFILES, code) ? code as Country : value.toLowerCase() === "fa" ? "IR" : null;
}
export function parsePreferences(raw: string | null, legacyRegion?: string | null, legacySource?: string | null): Preferences {
  const fallback = { ...DEFAULT_PREFERENCES, country: countryFromLocale(legacyRegion) ?? "US" as Country,
    regionConfirmed: Boolean(countryFromLocale(legacyRegion) && legacySource === "manual"), regionSource: legacySource === "manual" ? "manual" as const : "detected" as const, units: { ...AUTO_UNITS } };
  try {
    const data = JSON.parse(raw ?? "null");
    if (!data || data.version !== 1 || typeof data !== "object") return fallback;
    const units = Object.fromEntries(Object.entries(UNIT_OPTIONS).map(([key, choices]) => [key,
      typeof data.units?.[key] === "string" && (choices as readonly string[]).includes(data.units[key]) ? data.units[key] : "auto",
    ])) as UnitOverrides;
    return { version: 1,
      country: Object.hasOwn(REGION_PROFILES, data.country) ? data.country : fallback.country,
      regionConfirmed: data.regionConfirmed === true && Object.hasOwn(REGION_PROFILES, data.country), regionSource: data.regionSource === "manual" ? "manual" : "detected",
      language: LANGUAGE_OPTIONS.some((option) => option.value === data.language) ? data.language : "auto", units,
      calendar: CALENDAR_OPTIONS.some((option) => option.value === data.calendar) ? data.calendar : "auto",
      hourCycle: ["h12", "h23"].includes(data.hourCycle) ? data.hourCycle : "auto",
    };
  } catch { return fallback; }
}
export function resolvePreferences(preferences: Preferences): ResolvedPreferences {
  const profile = REGION_PROFILES[preferences.country];
  const language = preferences.language === "auto" ? profile.language : preferences.language;
  const units = Object.fromEntries(Object.entries(profile.units).map(([key, value]) => [key,
    preferences.units[key as keyof Units] === "auto" ? value : preferences.units[key as keyof Units],
  ])) as unknown as Units;
  return { country: preferences.country, language, direction: RTL_LANGUAGES.has(language) ? "rtl" : "ltr",
    locale: `${language}-${preferences.country}`, units,
    calendar: preferences.calendar === "auto" ? profile.calendar : preferences.calendar,
    hourCycle: preferences.hourCycle === "auto" ? profile.hourCycle : preferences.hourCycle,
    numbering: ({ fa:"arabext", ar:"arab", bn:"beng", hi:"deva", mr:"deva", ne:"deva", th:"thai", my:"mymr" } as Record<string,string>)[language] ?? "latn",
  };
}
