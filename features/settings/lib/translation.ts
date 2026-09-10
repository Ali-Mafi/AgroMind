import type { Language } from "../types/preferences";
import { PERSIAN } from "../constants/persian";
import { COMMON_PERSIAN } from "../constants/common-persian";
import { WEATHER_PERSIAN } from "../constants/weather-persian";
import { WORLD_TRANSLATIONS } from "../constants/world-translations";

export function translator(language: Language) {
  return (message: string, values: Record<string, string | number> = {}) => {
    const translated = language === "fa" ? PERSIAN[message] ?? COMMON_PERSIAN[message] ?? WEATHER_PERSIAN[message.toLowerCase().trim()] ?? message : WORLD_TRANSLATIONS[language]?.[message] ?? message;
    return translated.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
  };
}
