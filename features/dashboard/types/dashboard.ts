import type { Farm } from "@/features/farms/types/farms";

export interface DashboardStat {
  id: string;
  label: string;
  value: string;
  status: string;
}

export interface DashboardIrrigation {
  status: string;
  nextRun: string;
  duration: string;
}

export interface DashboardAI {
  status: string;
  message: string;
}


export type DashboardFarm = Farm;

export interface DashboardFarmData {
  farm: DashboardFarm;
  stats: DashboardStat[];
  irrigation: DashboardIrrigation;
  ai: DashboardAI;
  weather: DashboardWeather;

}

export interface DashboardWeather {
  temperature: string;
  condition: string;
  humidity: string;
  windSpeed: string;
}

