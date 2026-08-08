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