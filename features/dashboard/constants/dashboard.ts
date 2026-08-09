import type {
  DashboardAI,
  DashboardFarm,
  DashboardIrrigation,
  DashboardStat,
} from "@/features/dashboard/types/dashboard";

export const DASHBOARD_STATS: DashboardStat[] = [
  {
    id: "soil-moisture",
    label: "Soil Moisture",
    value: "48%",
    status: "Optimal",
  },
  {
    id: "temperature",
    label: "Temperature",
    value: "27°C",
    status: "Normal",
  },
  {
    id: "humidity",
    label: "Humidity",
    value: "62%",
    status: "Normal",
  },
  {
    id: "water-tank",
    label: "Water Tank",
    value: "82%",
    status: "Healthy",
  },
];

export const DASHBOARD_IRRIGATION: DashboardIrrigation = {
  status: "Scheduled",
  nextRun: "Tomorrow, 06:00",
  duration: "45 min",
};

export const DASHBOARD_AI: DashboardAI = {
  status: "Optimal",
  message: "Current soil conditions are suitable for irrigation.",
};

export const DASHBOARD_FARMS: DashboardFarm[] = [
  {
    id: "zaqeh-farm",
    name: "Zaqeh Farm",
    location: "Qazvin, Iran",
  },
];