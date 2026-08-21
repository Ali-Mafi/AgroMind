export interface WeatherCoordinates {
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
}

export interface DailyWeather {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitationProbability: number;
  weatherCode: number;
}

export interface WeatherData {
  coordinates: WeatherCoordinates;
  current: CurrentWeather;
  daily: DailyWeather[];
}