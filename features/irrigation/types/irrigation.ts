export interface IrrigationOverview {
  status: string;
  nextRun: string;
  duration: number | string;
  waterAmount: string;
}

export interface IrrigationControl {
  isRunning: boolean;
  duration: number;
}

export interface IrrigationSchedule {
  date: string;
  time: string;
  duration: number;
}

export interface IrrigationSensor {
  id: string;
  name: string;
  value: string;
  unit: string;
  status: "Optimal" | "Normal" | "Warning";
}

export interface SensorStatusProps {
  sensors: IrrigationSensor[];
  farmName: string;
}