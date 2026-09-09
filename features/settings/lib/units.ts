import type { ResolvedPreferences, Units } from "../types/preferences";

// Exact international acre/foot, statute mile, US liquid gallon and inch factors.
const FACTORS: Record<string, number> = { sqm: 1, sqft: .09290304, hectare: 10000, acre: 4046.8564224, km: 1, mile: 1.609344, m: 1, ft: .3048, kmh: 1, mph: 1.609344, mm: 1, inch: 25.4, litre: 1, "us-gallon": 3.785411784, hpa: 1, inhg: 33.8638866667 };
export const SYMBOLS: Record<string, string> = { celsius: "°C", fahrenheit: "°F", sqm: "m²", sqft: "ft²", hectare: "ha", acre: "ac", km: "km", mile: "mi", m: "m", ft: "ft", kmh: "km/h", mph: "mph", mm: "mm", inch: "in", litre: "L", "us-gallon": "gal (US)", hpa: "hPa", inhg: "inHg" };
export function fromCanonical(value: number, kind: keyof Units, units: Units) {
  return kind === "temperature" ? units.temperature === "fahrenheit" ? value * 9 / 5 + 32 : value : value / FACTORS[units[kind]];
}
export function toCanonical(value: number, kind: keyof Units, units: Units) {
  return kind === "temperature" ? units.temperature === "fahrenheit" ? (value - 32) * 5 / 9 : value : value * FACTORS[units[kind]];
}
export function parseLocalizedNumber(input: string): number {
  const ascii = input.replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632)).replace(/٬/g, "").replace(/٫/g, ".");
  return ascii.trim() ? Number(ascii) : NaN;
}
export function createFormatters(settings: ResolvedPreferences) {
  const numbers = new Map<string, Intl.NumberFormat>();
  const number = (value: number, digits = 1, minimumDigits = 0) => {
    if (!Number.isFinite(value)) return "—";
    const key = `${digits}-${minimumDigits}`;
    if (!numbers.has(key)) numbers.set(key, new Intl.NumberFormat(settings.locale, { maximumFractionDigits: digits, minimumFractionDigits: minimumDigits, numberingSystem: settings.numbering }));
    return numbers.get(key)!.format(value);
  };
  const convert = (value: number, kind: keyof Units) => fromCanonical(value, kind, settings.units);
  const symbol = (kind: keyof Units) => SYMBOLS[settings.units[kind]];
  const measure = (value: number | null | undefined, kind: keyof Units, digits = kind === "precipitation" || kind === "area" || kind === "gardenArea" ? 2 : 1) =>
    value == null || !Number.isFinite(value) ? "—" : `${kind === "precipitation" ? rain(value) : number(convert(value, kind), digits)} ${symbol(kind)}`;
  const date = (value: Date | number, options: Intl.DateTimeFormatOptions = {}) => new Intl.DateTimeFormat(settings.locale, {
    year: "numeric", month: "short", day: "numeric", hourCycle: settings.hourCycle, ...options, calendar: settings.calendar, numberingSystem: settings.numbering,
  }).format(value);
  const clock = (value: string | null) => {
    if (!value) return "—";
    const wall = value.includes("T") ? value.slice(11, 16) : value.slice(0, 5);
    if (!/^\d{2}:\d{2}$/.test(wall)) return "—";
    return new Intl.DateTimeFormat(settings.locale, { timeZone: "UTC", hour: "2-digit", minute: "2-digit", hourCycle: settings.hourCycle, numberingSystem: settings.numbering }).format(new Date(`2000-01-01T${wall}:00Z`));
  };
  const rain = (value: number | null | undefined) => value == null || !Number.isFinite(value) ? "—" : value > 0 && convert(value, "precipitation") < .01 ? `<${number(.01, 2)}` : number(convert(value, "precipitation"), 2, settings.units.precipitation === "mm" ? 1 : 2);
  return { number, convert, symbol, measure, date, clock,
    input: (value: number, kind: keyof Units) => String(Number(convert(value, kind).toFixed(8))),
    parse: (value: string, kind: keyof Units) => toCanonical(parseLocalizedNumber(value), kind, settings.units),
    temperature: (value: number | null | undefined) => value == null || !Number.isFinite(value) ? "—" : `${number(convert(value, "temperature"), 0)}°`,
    rain,
  };
}
