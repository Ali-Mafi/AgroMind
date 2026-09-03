import type {
  AirQualityData,
} from "@/features/weather/types/air-quality";

import type {
  WeatherCoordinates,
} from "@/features/weather/types/weather";

const OPEN_METEO_AIR_QUALITY_URL =
  "https://air-quality-api.open-meteo.com/v1/air-quality";

export async function getAirQuality(
  coordinates: WeatherCoordinates,
): Promise<AirQualityData> {
  const variables = [
    "pm10",
    "pm2_5",
    "dust",
    "aerosol_optical_depth",
    "european_aqi",
    "us_aqi",
  ].join(",");

  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),

    current: variables,

    hourly: variables,

    timezone: "auto",

    forecast_days: "5",
  });

  const response = await fetch(
    `${OPEN_METEO_AIR_QUALITY_URL}?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch air quality data.",
    );
  }

  const data = await response.json();

  return {
    coordinates,

    timezone: data.timezone,

    timezoneAbbreviation:
      data.timezone_abbreviation,

    utcOffsetSeconds:
      data.utc_offset_seconds,

    current: {
      pm10:
        data.current?.pm10 ?? null,

      pm2_5:
        data.current?.pm2_5 ?? null,

      dust:
        data.current?.dust ?? null,

      aerosolOpticalDepth:
        data.current?.aerosol_optical_depth ??
        null,

      europeanAqi:
        data.current?.european_aqi ?? null,

      usAqi:
        data.current?.us_aqi ?? null,
    },

    hourly: data.hourly.time.map(
      (time: string, index: number) => ({
        time,

        pm10:
          data.hourly.pm10[index] ?? null,

        pm2_5:
          data.hourly.pm2_5[index] ?? null,

        dust:
          data.hourly.dust[index] ?? null,

        aerosolOpticalDepth:
          data.hourly
            .aerosol_optical_depth[index] ??
          null,

        europeanAqi:
          data.hourly
            .european_aqi[index] ?? null,

        usAqi:
          data.hourly.us_aqi[index] ?? null,
      }),
    ),
  };
}