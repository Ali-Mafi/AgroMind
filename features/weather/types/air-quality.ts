import type {
  WeatherCoordinates,
} from "@/features/weather/types/weather";

export interface CurrentAirQuality {
  pm10: number | null;

  pm2_5: number | null;

  dust: number | null;

  aerosolOpticalDepth: number | null;

  europeanAqi: number | null;

  usAqi: number | null;
}

export interface HourlyAirQuality {
  time: string;

  pm10: number | null;

  pm2_5: number | null;

  dust: number | null;

  aerosolOpticalDepth: number | null;

  europeanAqi: number | null;

  usAqi: number | null;
}

export interface AirQualityData {
  coordinates: WeatherCoordinates;

  timezone: string;

  timezoneAbbreviation: string;

  utcOffsetSeconds: number;

  current: CurrentAirQuality;

  hourly: HourlyAirQuality[];
}