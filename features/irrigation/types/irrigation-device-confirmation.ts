export type IrrigationStartConfirmationEvidence =
  | {
      type: "controller-state";

      state: "irrigating";
    }
  | {
      type: "flow-detected";

      sensorId: string;

      flowRate?: number;

      unit?: "l/s" | "l/min";
    };

export interface IrrigationStartConfirmation {
  confirmationId: string;

  commandId: string;

  controllerId: string;

  farmId: string;

  scheduleId: string;

  scheduleRevision: number;

  observedAt: string;

  evidence: IrrigationStartConfirmationEvidence;
}