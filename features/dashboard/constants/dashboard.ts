import type {
  DashboardFarm,
  DashboardFarmData,
} from "@/features/dashboard/types/dashboard";


const ZAQEH_FARM: DashboardFarm = {
  id: "zaqeh-farm",
  name: "Zaqeh Farm",
  location: "Qazvin, Iran",
};

const KASPIAN_FARM: DashboardFarm = {
  id: "caspian-farm",
  name: "Caspian Farm",
  location: "Qazvin, Iran",
};



export const DASHBOARD_FARMS: DashboardFarm[] = [
  ZAQEH_FARM,
  KASPIAN_FARM,
];

export const DASHBOARD_FARM_DATA: DashboardFarmData[] = [
  {
    farm: ZAQEH_FARM,
    stats: [
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
    ],
    irrigation: {
      status: "Scheduled",
      nextRun: "Tomorrow, 06:00",
      duration: "45 min",
    },
    ai: {
      status: "Optimal",
      message: "Current soil conditions are suitable for irrigation.",
    },
    weather: {
  temperature: "27°C",
  condition: "Sunny",
  humidity: "62%",
  windSpeed: "14 km/h",
},
  },
  {
    farm: KASPIAN_FARM,
    stats: [
      {
        id: "soil-moisture",
        label: "Soil Moisture",
        value: "31%",
        status: "Needs Attention",
      },
      {
        id: "temperature",
        label: "Temperature",
        value: "29°C",
        status: "Warm",
      },
      {
        id: "humidity",
        label: "Humidity",
        value: "55%",
        status: "Normal",
      },
      {
        id: "water-tank",
        label: "Water Tank",
        value: "46%",
        status: "Low",
      },
    ],
    irrigation: {
      status: "Recommended",
      nextRun: "Today, 18:30",
      duration: "60 min",
    },
    ai: {
      status: "Needs Attention",
      message: "Soil moisture is below the preferred level. Consider irrigation soon.",
    },
    weather: {
  temperature: "29°C",
  condition: "Partly Cloudy",
  humidity: "55%",
  windSpeed: "11 km/h",
},
  },
];

