import type { Calendar, Country, Language, Units } from "../types/preferences";

export const METRIC_UNITS: Units = { temperature: "celsius", area: "hectare", distance: "km", length: "m", wind: "kmh", precipitation: "mm", volume: "litre", pressure: "hpa" };
export const US_UNITS: Units = { temperature: "fahrenheit", area: "acre", distance: "mile", length: "ft", wind: "mph", precipitation: "inch", volume: "us-gallon", pressure: "inhg" };
interface RegionProfile {
  name: string; locale: string; language: Language; calendar: Calendar; hourCycle: "h12" | "h23";
  units: Units; example: { location: string; crop: string; area: number; temperature: number };
}
export const REGION_PROFILES: Record<Country, RegionProfile> = {
  IR: { name: "Iran", locale: "fa-IR", language: "fa", calendar: "persian", hourCycle: "h23", units: METRIC_UNITS,
    example: { location: "Qazvin, Iran", crop: "Corn", area: 40000, temperature: 27 } },
  US: { name: "United States", locale: "en-US", language: "en", calendar: "gregory", hourCycle: "h12", units: US_UNITS,
    example: { location: "Fresno, California", crop: "Almonds", area: 80937.128448, temperature: 27 } },
  GB: { name: "United Kingdom", locale: "en-GB", language: "en", calendar: "gregory", hourCycle: "h23", units: { ...METRIC_UNITS, distance: "mile", wind: "mph" },
    example: { location: "Norfolk, United Kingdom", crop: "Wheat", area: 80000, temperature: 18 } },
  CN: { name: "China", locale: "zh-CN", language: "en", calendar: "gregory", hourCycle: "h23", units: METRIC_UNITS,
    example: { location: "Chengdu, China", crop: "Rice", area: 40000, temperature: 25 } },
  JP: { name: "Japan", locale: "ja-JP", language: "en", calendar: "gregory", hourCycle: "h23", units: METRIC_UNITS,
    example: { location: "Niigata, Japan", crop: "Rice", area: 20000, temperature: 23 } },
  TH: { name: "Thailand", locale: "th-TH", language: "en", calendar: "buddhist", hourCycle: "h23", units: METRIC_UNITS,
    example: { location: "Chiang Mai, Thailand", crop: "Rice", area: 40000, temperature: 29 } },
};
export const UNIT_OPTIONS = {
  temperature: ["celsius", "fahrenheit"], area: ["sqm", "hectare", "acre"], distance: ["km", "mile"], length: ["m", "ft"],
  wind: ["kmh", "mph"], precipitation: ["mm", "inch"], volume: ["litre", "us-gallon"], pressure: ["hpa", "inhg"],
} as const;
export const UNIT_NAMES: Record<string, string> = { celsius: "Celsius (°C)", fahrenheit: "Fahrenheit (°F)", sqm: "Square metres (m²)", hectare: "Hectares (ha)", acre: "Acres (ac)", km: "Kilometres (km)", mile: "Miles (mi)", m: "Metres (m)", ft: "Feet (ft)", kmh: "Kilometres per hour (km/h)", mph: "Miles per hour (mph)", mm: "Millimetres (mm)", inch: "Inches (in)", litre: "Litres (L)", "us-gallon": "US gallons (gal)", hpa: "Hectopascals (hPa)", inhg: "Inches of mercury (inHg)" };
