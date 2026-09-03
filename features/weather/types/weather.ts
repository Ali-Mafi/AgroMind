export interface WeatherCoordinates {
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {

  time: string;
  intervalSeconds: number;

  temperature: number;
  feelsLike: number;

  humidity: number;
  dewPoint: number;

  precipitation: number;
  precipitationProbability: number | null;

  rain: number;
  showers: number;
  snowfall: number;

  weatherCode: number;

  isDay: boolean;

  cloudCover: number;

  pressureMsl: number;
  surfacePressure: number;

  visibility: number;

  windSpeed: number;
  windDirection: number;
  windGusts: number;
}

export interface HourlyWeather {
  time: string;

  temperature: number;
  feelsLike: number;

  humidity: number;
  dewPoint: number;

  precipitationProbability: number;
  precipitation: number;

  rain: number;
  showers: number;
  snowfall: number;

  weatherCode: number;

  isDay: boolean;

  cloudCover: number;

  visibility: number;
  pressureMsl: number;

  windSpeed: number;
  windDirection: number;
  windGusts: number;
}

export interface DailyWeather {
  date: string;

  temperatureMax: number;
  temperatureMin: number;

  feelsLikeMax: number;
  feelsLikeMin: number;

  precipitationProbability: number;
  precipitationSum: number;

  rainSum: number;
  showersSum: number;
  snowfallSum: number;

  weatherCode: number;

  windSpeedMax: number;
  windGustsMax: number;
  windDirectionDominant: number;

  sunrise: string;
  sunset: string;

  uvIndexMax: number;
}

export interface WeatherData {
  coordinates: WeatherCoordinates;

  timezone: string;
  timezoneAbbreviation: string;
  utcOffsetSeconds: number;

  elevation: number;

  current: CurrentWeather;

  hourly: HourlyWeather[];

  daily: DailyWeather[];
}