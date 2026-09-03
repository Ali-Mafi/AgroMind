import type {
  NormalizedWeatherCondition,
  NormalizedWindDirection,
  WeatherIntensity,
  WindDirectionCardinal,
} from "@/features/weather/types/weather-normalization";

function createCondition(
  code: number,
  condition: NormalizedWeatherCondition["condition"],
  label: string,
  options?: {
    intensity?: WeatherIntensity;
    isPrecipitation?: boolean;
  },
): NormalizedWeatherCondition {
  return {
    code,
    condition,
    label,
    intensity: options?.intensity,
    isPrecipitation:
      options?.isPrecipitation ?? false,
  };
}

export function normalizeWeatherCode(
  code: number,
): NormalizedWeatherCondition {
  switch (code) {
    case 0:
      return createCondition(
        code,
        "clear",
        "Clear",
      );

    case 1:
      return createCondition(
        code,
        "mainly-clear",
        "Mainly Clear",
      );

    case 2:
      return createCondition(
        code,
        "partly-cloudy",
        "Partly Cloudy",
      );

    case 3:
      return createCondition(
        code,
        "overcast",
        "Overcast",
      );

    case 45:
      return createCondition(
        code,
        "fog",
        "Fog",
      );

    case 48:
      return createCondition(
        code,
        "rime-fog",
        "Rime Fog",
      );

    case 51:
      return createCondition(
        code,
        "drizzle",
        "Light Drizzle",
        {
          intensity: "light",
          isPrecipitation: true,
        },
      );

    case 53:
      return createCondition(
        code,
        "drizzle",
        "Moderate Drizzle",
        {
          intensity: "moderate",
          isPrecipitation: true,
        },
      );

    case 55:
      return createCondition(
        code,
        "drizzle",
        "Heavy Drizzle",
        {
          intensity: "heavy",
          isPrecipitation: true,
        },
      );

    case 56:
      return createCondition(
        code,
        "freezing-drizzle",
        "Light Freezing Drizzle",
        {
          intensity: "light",
          isPrecipitation: true,
        },
      );

    case 57:
      return createCondition(
        code,
        "freezing-drizzle",
        "Heavy Freezing Drizzle",
        {
          intensity: "heavy",
          isPrecipitation: true,
        },
      );

    case 61:
      return createCondition(
        code,
        "rain",
        "Light Rain",
        {
          intensity: "light",
          isPrecipitation: true,
        },
      );

    case 63:
      return createCondition(
        code,
        "rain",
        "Moderate Rain",
        {
          intensity: "moderate",
          isPrecipitation: true,
        },
      );

    case 65:
      return createCondition(
        code,
        "rain",
        "Heavy Rain",
        {
          intensity: "heavy",
          isPrecipitation: true,
        },
      );

    case 66:
      return createCondition(
        code,
        "freezing-rain",
        "Light Freezing Rain",
        {
          intensity: "light",
          isPrecipitation: true,
        },
      );

    case 67:
      return createCondition(
        code,
        "freezing-rain",
        "Heavy Freezing Rain",
        {
          intensity: "heavy",
          isPrecipitation: true,
        },
      );

    case 71:
      return createCondition(
        code,
        "snow",
        "Light Snow",
        {
          intensity: "light",
          isPrecipitation: true,
        },
      );

    case 73:
      return createCondition(
        code,
        "snow",
        "Moderate Snow",
        {
          intensity: "moderate",
          isPrecipitation: true,
        },
      );

    case 75:
      return createCondition(
        code,
        "snow",
        "Heavy Snow",
        {
          intensity: "heavy",
          isPrecipitation: true,
        },
      );

    case 77:
      return createCondition(
        code,
        "snow-grains",
        "Snow Grains",
        {
          isPrecipitation: true,
        },
      );

    case 80:
      return createCondition(
        code,
        "rain-showers",
        "Light Rain Showers",
        {
          intensity: "light",
          isPrecipitation: true,
        },
      );

    case 81:
      return createCondition(
        code,
        "rain-showers",
        "Moderate Rain Showers",
        {
          intensity: "moderate",
          isPrecipitation: true,
        },
      );

    case 82:
      return createCondition(
        code,
        "rain-showers",
        "Heavy Rain Showers",
        {
          intensity: "heavy",
          isPrecipitation: true,
        },
      );

    case 85:
      return createCondition(
        code,
        "snow-showers",
        "Light Snow Showers",
        {
          intensity: "light",
          isPrecipitation: true,
        },
      );

    case 86:
      return createCondition(
        code,
        "snow-showers",
        "Heavy Snow Showers",
        {
          intensity: "heavy",
          isPrecipitation: true,
        },
      );

    case 95:
      return createCondition(
        code,
        "thunderstorm",
        "Thunderstorm",
        {
          isPrecipitation: true,
        },
      );

    case 96:
      return createCondition(
        code,
        "thunderstorm-hail",
        "Thunderstorm with Hail",
        {
          intensity: "light",
          isPrecipitation: true,
        },
      );

    case 99:
      return createCondition(
        code,
        "thunderstorm-hail",
        "Severe Thunderstorm with Hail",
        {
          intensity: "heavy",
          isPrecipitation: true,
        },
      );

    default:
      return createCondition(
        code,
        "unknown",
        "Unknown Conditions",
      );
  }
}

const WIND_DIRECTIONS: Array<{
  cardinal: WindDirectionCardinal;
  label: string;
}> = [
  { cardinal: "N", label: "North" },
  {
    cardinal: "NNE",
    label: "North-northeast",
  },
  {
    cardinal: "NE",
    label: "Northeast",
  },
  {
    cardinal: "ENE",
    label: "East-northeast",
  },
  { cardinal: "E", label: "East" },
  {
    cardinal: "ESE",
    label: "East-southeast",
  },
  {
    cardinal: "SE",
    label: "Southeast",
  },
  {
    cardinal: "SSE",
    label: "South-southeast",
  },
  { cardinal: "S", label: "South" },
  {
    cardinal: "SSW",
    label: "South-southwest",
  },
  {
    cardinal: "SW",
    label: "Southwest",
  },
  {
    cardinal: "WSW",
    label: "West-southwest",
  },
  { cardinal: "W", label: "West" },
  {
    cardinal: "WNW",
    label: "West-northwest",
  },
  {
    cardinal: "NW",
    label: "Northwest",
  },
  {
    cardinal: "NNW",
    label: "North-northwest",
  },
];

export function normalizeWindDirection(
  degrees: number,
): NormalizedWindDirection {
  const normalizedDegrees =
    ((degrees % 360) + 360) % 360;

  const directionIndex =
    Math.round(normalizedDegrees / 22.5) % 16;

  const direction =
    WIND_DIRECTIONS[directionIndex];

  return {
    degrees: normalizedDegrees,
    cardinal: direction.cardinal,
    label: direction.label,
  };
}