import { COMMON_PERSIAN } from "./common-persian";
import { PERSIAN } from "./persian";
import { WEATHER_PERSIAN } from "./weather-persian";

const persianValues: Record<string, string> = {
  ...WEATHER_PERSIAN,
  ...COMMON_PERSIAN,
  ...PERSIAN,
};

export const CANONICAL_KEYS = Object.freeze(Object.keys(persianValues).sort());
export const ENGLISH_CATALOG: Record<string, string> = Object.fromEntries(CANONICAL_KEYS.map((key) => [key, key]));
export const PERSIAN_CATALOG: Record<string, string> = Object.fromEntries(CANONICAL_KEYS.map((key) => [key, persianValues[key]]));
export const LOCALE_CATALOGS: Record<string, Record<string, string>> = {
  en: ENGLISH_CATALOG,
  fa: PERSIAN_CATALOG,
};
