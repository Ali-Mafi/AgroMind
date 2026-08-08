export const DASHBOARD_STATS = [
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
] as const;

export const DASHBOARD_IRRIGATION = {
  status: "Scheduled",
  nextRun: "Tomorrow, 06:00",
  duration: "45 min",
} as const;

export const DASHBOARD_AI = {
  status: "Optimal",
  message: "Current soil conditions are suitable for irrigation.",
} as const;