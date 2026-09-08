import type {
  NormalizedWeatherCondition,
  WeatherCondition,
  WeatherIntensity,
} from "@/features/weather/types/weather-normalization";

// These are WeatherAPI codes, NOT WMO codes. Preserve the provider's label.
// https://www.weatherapi.com/docs/weather_conditions.json
// Groups select the existing visual treatment; mixed precipitation keeps its
// precise description in `label`. An ambiguous intensity remains unspecified.
const CONDITIONS: Record<number, [WeatherCondition, WeatherIntensity?]> = {
  1000: ["clear"],
  1003: ["partly-cloudy"],
  1006: ["overcast"],
  1009: ["overcast"],
  1012: ["fog"],
  1015: ["dust"],
  1018: ["dust"],
  1021: ["dust"],
  1024: ["dust"],
  1027: ["dust"],
  1030: ["fog"],
  1033: ["fog"],
  1036: ["fog"],
  1039: ["fog"],
  1042: ["fog"],
  1045: ["dust"],
  1048: ["dust"],
  1063: ["rain"],
  1066: ["snow"],
  1069: ["snow"],
  1072: ["freezing-drizzle"],
  1087: ["thunderstorm"],
  1114: ["snow"],
  1117: ["snow", "heavy"],
  1135: ["fog"],
  1147: ["rime-fog"],
  1150: ["drizzle", "light"],
  1153: ["drizzle", "light"],
  1168: ["freezing-drizzle"],
  1171: ["freezing-drizzle", "heavy"],
  1180: ["rain", "light"],
  1183: ["rain", "light"],
  1186: ["rain", "moderate"],
  1189: ["rain", "moderate"],
  1192: ["rain", "heavy"],
  1195: ["rain", "heavy"],
  1198: ["freezing-rain", "light"],
  1201: ["freezing-rain"],
  1204: ["snow", "light"],
  1207: ["snow"],
  1210: ["snow", "light"],
  1213: ["snow", "light"],
  1216: ["snow", "moderate"],
  1219: ["snow", "moderate"],
  1222: ["snow", "heavy"],
  1225: ["snow", "heavy"],
  1237: ["snow-grains"],
  1240: ["rain-showers", "light"],
  1243: ["rain-showers"],
  1246: ["rain-showers", "heavy"],
  1249: ["snow-showers", "light"],
  1252: ["snow-showers"],
  1255: ["snow-showers", "light"],
  1258: ["snow-showers"],
  1261: ["snow-grains", "light"],
  1264: ["snow-grains"],
  1273: ["thunderstorm", "light"],
  1276: ["thunderstorm"],
  1279: ["thunderstorm", "light"],
  1282: ["thunderstorm"],
};

export function normalizeWeatherApiCondition(
  code: number,
  label: string,
): NormalizedWeatherCondition {
  const [condition, intensity] = CONDITIONS[code] ?? ["unknown"];
  const isPrecipitation = code !== 1087 && [
    "drizzle", "freezing-drizzle", "rain", "freezing-rain",
    "snow", "snow-grains", "rain-showers", "snow-showers", "thunderstorm",
  ].includes(condition);

  return { code, condition, label, intensity, isPrecipitation };
}
