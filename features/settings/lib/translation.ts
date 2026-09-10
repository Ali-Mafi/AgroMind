import type { Language } from "../types/preferences";
import { LOCALE_CATALOGS } from "../constants/catalogs";

export function translator(language: Language) {
  return (message: string, values: Record<string, string | number> = {}) => {
    const catalog = LOCALE_CATALOGS[language];
    const normalized = message.toLowerCase().trim();
    const translated = catalog?.[message] ?? catalog?.[normalized] ?? message;
    return translated.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
  };
}
