export interface IrrigationControllerStartCommand {
  type: "start-irrigation";

  commandId: string;

  idempotencyKey: string;

  controllerId: string;

  farmId: string;

  scheduleId: string;

  scheduleRevision: number;

  duration: number;

  requestedAt: string;
}

export type IrrigationControllerCommand =
  IrrigationControllerStartCommand;

export type IrrigationControllerCommandDispatchResult =
  | {
      status: "accepted";

      commandId: string;

      acceptedAt: string;
    }
  | {
      status: "already-accepted";

      commandId: string;

      acceptedAt: string;
    }
  | {
      status: "rejected";

      commandId: string;

      rejectedAt: string;

      reason: string;
    }
  | {
      status: "unknown";

      commandId: string;

      observedAt: string;

      reason: string;
    };