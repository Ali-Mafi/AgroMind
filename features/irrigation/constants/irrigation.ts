import type { 
    IrrigationOverview,
    IrrigationSchedule,
    IrrigationSensor
 } from "@/features/irrigation/types/irrigation";



export const IRRIGATION_OVERVIEW_BY_FARM: Record<
  string,
  IrrigationOverview
> = {
  "my-farm": {
    status: "Scheduled",
    nextRun: "Tomorrow, 06:00",
    duration: "45 min",
    waterAmount: "18,000 L",
  },

  "my-garden": {
    status: "Recommended",
    nextRun: "Today, 18:30",
    duration: "60 min",
    waterAmount: "22,000 L",
  },
};

export const IRRIGATION_SCHEDULE_BY_FARM: Record<
  string,
  IrrigationSchedule
> = {
  "my-farm": {
    date: "2026-08-11",
    time: "06:00",
    duration: 45,
  },

  "my-garden": {
    date: "2026-08-10",
    time: "18:30",
    duration: 60,
  },
};

export const IRRIGATION_SENSORS_BY_FARM: Record<
  string,
  IrrigationSensor[]
> = {
  "my-farm": [
    {
      id: "field-start-moisture",
      name: "Field Start",
      value: "48",
      unit: "%",
      status: "Optimal",
    },
    {
      id: "field-end-moisture",
      name: "Field End",
      value: "41",
      unit: "%",
      status: "Normal",
    },
    {
      id: "water-tank",
      name: "Water Tank",
      value: "82",
      unit: "%",
      status: "Optimal",
    },
  ],

  "my-garden": [
    {
      id: "field-start-moisture",
      name: "Field Start",
      value: "31",
      unit: "%",
      status: "Warning",
    },
    {
      id: "field-end-moisture",
      name: "Field End",
      value: "26",
      unit: "%",
      status: "Warning",
    },
    {
      id: "water-tank",
      name: "Water Tank",
      value: "46",
      unit: "%",
      status: "Normal",
    },
  ],
};