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

export interface DashboardFarm {
  id: string;
  name: string;
  location: string;
}

export interface DashboardFarmData {
  farm: DashboardFarm;
  stats: DashboardStat[];
  irrigation: DashboardIrrigation;
  ai: DashboardAI;
}