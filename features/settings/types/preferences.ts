export type Country = "IR" | "US" | "GB" | "CN" | "JP" | "TH";
export type Language = "en" | "fa";
export type AreaUnit = "sqm" | "hectare" | "acre";
export interface Units {
  temperature: "celsius" | "fahrenheit";
  area: AreaUnit;
  distance: "km" | "mile";
  length: "m" | "ft";
  wind: "kmh" | "mph";
  precipitation: "mm" | "inch";
  volume: "litre" | "us-gallon";
  pressure: "hpa" | "inhg";
}
export type UnitOverrides = { [K in keyof Units]: Units[K] | "auto" };
export type Calendar = "gregory" | "persian" | "buddhist";
export interface Preferences {
  version: 1; country: Country; regionConfirmed: boolean; regionSource: "manual" | "detected";
  language: Language | "auto"; units: UnitOverrides; calendar: Calendar | "auto";
  hourCycle: "h12" | "h23" | "auto"; numbering: "latn" | "arabext" | "auto";
}
export interface ResolvedPreferences {
  country: Country; language: Language; direction: "rtl" | "ltr"; locale: string;
  units: Units; calendar: Calendar; hourCycle: "h12" | "h23"; numbering: "latn" | "arabext";
}
