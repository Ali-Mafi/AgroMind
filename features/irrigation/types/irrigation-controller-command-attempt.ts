export type IrrigationControllerCommandAttemptOutcome =
  | "accepted"
  | "already-accepted"
  | "rejected"
  | "unknown";

export interface IrrigationControllerCommandAttempt {
  attemptId: string;

  commandId: string;

  attemptNumber: number;

  startedAt: string;

  finishedAt?: string;

  outcome?: IrrigationControllerCommandAttemptOutcome;

  reason?: string;
}