export type IrrigationScheduleStatus =
  | "scheduled"
  | "past-due";
export interface IrrigationOverview {
  status: IrrigationScheduleStatus;
  nextRun: string;
  duration: number | string;
  waterAmount: string;
}

export interface IrrigationControl {
  isRunning: boolean;
  duration: number;
}

export interface IrrigationSchedule {
  id?: string;
  revision?: number;
  date: string;
  time: string;
  duration: number;
  timeZone?: string;
  createdAt?: string;
  updatedAt?: string;
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

export type IrrigationControllerStatus =
  | "not-connected"
  | "connected"
  | "offline"
  | "error";

export type IrrigationExecutionRoute =
  | "manual"
  | "automatic"
  | "unavailable";  

export type IrrigationDueAction =
  | "send-manual-reminder"
  | "request-automatic-start"
  | "report-controller-unavailable";