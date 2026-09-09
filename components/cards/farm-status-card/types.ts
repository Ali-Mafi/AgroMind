export interface FarmStatusCardProps {
  farmName: string;
  area?: number;
  crop?: string;

  location: string;

  moisture: number;

  temperature: number;

  humidity: number;

  weather: string;

  recommendation: string;
}
