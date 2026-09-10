import { COUNTRY_CODES, LANGUAGE_OPTIONS } from "./locale-options";
import type { Calendar, Country, Language, Units } from "../types/preferences";

export const METRIC_UNITS: Units = { temperature: "celsius", area: "hectare", gardenArea: "sqm", distance: "km", length: "m", wind: "kmh", precipitation: "mm", volume: "litre", pressure: "hpa" };
export const US_UNITS: Units = { temperature: "fahrenheit", area: "acre", gardenArea: "sqft", distance: "mile", length: "ft", wind: "mph", precipitation: "inch", volume: "us-gallon", pressure: "inhg" };
export interface RegionProfile {
  name: string; locale: string; language: Language; calendar: Calendar; hourCycle: "h12" | "h23";
  units: Units; example: { location: string; crop: string; area: number; temperature: number };
}
const LANGUAGE_BY_COUNTRY: Record<string, Language> = {
  AF:"fa", AL:"sq", AM:"hy", AZ:"az", BD:"bn", BG:"bg", BR:"pt", BY:"ru", CN:"zh", CZ:"cs", DE:"de", DK:"da", EE:"et", ES:"es", ET:"am", FI:"fi", FR:"fr", GE:"ka", GR:"el", HR:"hr", HU:"hu", ID:"id", IL:"he", IN:"hi", IR:"fa", IS:"is", IT:"it", JP:"ja", KG:"ru", KH:"km", KR:"ko", KZ:"kk", LA:"lo", LK:"si", LT:"lt", LV:"lv", MK:"mk", MM:"my", MN:"mn", MY:"ms", NL:"nl", NO:"no", NP:"ne", PK:"ur", PH:"fil", PL:"pl", PT:"pt", RO:"ro", RU:"ru", SA:"ar", SE:"sv", SI:"sl", SK:"sk", TH:"th", TJ:"tg", TM:"tk", TR:"tr", TW:"zh", UA:"uk", UZ:"uz", VN:"vi"
};
const SPECIFIC: Record<string, Partial<RegionProfile>> = {
  IR:{ locale:"fa-IR", language:"fa", calendar:"persian", example:{ location:"Qazvin, Iran", crop:"Corn", area:40000, temperature:27 } },
  US:{ locale:"en-US", language:"en", hourCycle:"h12", units:US_UNITS, example:{ location:"Fresno, California", crop:"Almonds", area:80937.128448, temperature:27 } },
  GB:{ locale:"en-GB", units:{ ...METRIC_UNITS, distance:"mile", wind:"mph" }, example:{ location:"Norfolk, United Kingdom", crop:"Wheat", area:80000, temperature:18 } },
  CN:{ example:{ location:"Chengdu, China", crop:"Rice", area:40000, temperature:25 } },
  JP:{ calendar:"japanese", example:{ location:"Niigata, Japan", crop:"Rice", area:20000, temperature:23 } },
  TH:{ calendar:"buddhist", example:{ location:"Chiang Mai, Thailand", crop:"Rice", area:40000, temperature:29 } },
  SA:{ calendar:"islamic-umalqura" }, IL:{ calendar:"hebrew" }, ET:{ calendar:"ethiopic" }, IN:{ calendar:"indian" }, TW:{ calendar:"roc" }
};
function makeProfile(country: Country): RegionProfile {
  const regionalLanguage = LANGUAGE_BY_COUNTRY[country] ?? "en";
  const language = LANGUAGE_OPTIONS.some((option) => option.value === regionalLanguage) ? regionalLanguage : "en";
  let name = country;
  try { name = new Intl.DisplayNames(["en"], { type:"region" }).of(country) ?? country; } catch {}
  const base: RegionProfile = { name, locale:`${language}-${country}`, language, calendar:"gregory", hourCycle:"h23", units:METRIC_UNITS,
    example:{ location:`Local farm, ${name}`, crop:"Wheat", area:40000, temperature:24 } };
  const override = SPECIFIC[country];
  return { ...base, ...override, units:override?.units ?? base.units, example:override?.example ?? base.example };
}
export const REGION_PROFILES: Record<Country, RegionProfile> = Object.fromEntries(COUNTRY_CODES.map((country) => [country, makeProfile(country)]));
export const UNIT_OPTIONS = {
  temperature:["celsius","fahrenheit"], area:["sqm","hectare","acre"], gardenArea:["sqm","sqft","acre"], distance:["km","mile"], length:["m","ft"], wind:["kmh","mph"], precipitation:["mm","inch"], volume:["litre","us-gallon"], pressure:["hpa","inhg"],
} as const;
export const UNIT_NAMES: Record<string,string> = { celsius:"Celsius (°C)", fahrenheit:"Fahrenheit (°F)", sqm:"Square metres (m²)", sqft:"Square feet (ft²)", hectare:"Hectares (ha)", acre:"Acres (ac)", km:"Kilometres (km)", mile:"Miles (mi)", m:"Metres (m)", ft:"Feet (ft)", kmh:"Kilometres per hour (km/h)", mph:"Miles per hour (mph)", mm:"Millimetres (mm)", inch:"Inches (in)", litre:"Litres (L)", "us-gallon":"US gallons (gal)", hpa:"Hectopascals (hPa)", inhg:"Inches of mercury (inHg)" };
