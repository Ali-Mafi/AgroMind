import type {
  IrrigationControllerStatus,
} from "@/features/irrigation/types/irrigation";

interface IrrigationEventBase {
  id: string;
  farmId: string;
  scheduleId: string;
  scheduleRevision: number;
  occurredAt: string;
}

export interface ScheduleDueEvent
  extends IrrigationEventBase {
  type: "schedule_due";
}

export interface ManualReminderSentEvent
  extends IrrigationEventBase {
  type: "manual_reminder_sent";
}

export interface AutomaticStartRequestedEvent
  extends IrrigationEventBase {
  type: "automatic_start_requested";
  duration: number;
}

export interface ControllerUnavailableEvent
  extends IrrigationEventBase {
  type: "controller_unavailable";
  controllerStatus: Extract<
    IrrigationControllerStatus,
    "offline" | "error"
  >;
}

export interface IrrigationStartedEvent
  extends IrrigationEventBase {
  type: "irrigation_started";
}

export interface IrrigationFailedEvent
  extends IrrigationEventBase {
  type: "irrigation_failed";
  reason: string;
}

export interface IrrigationCompletedEvent
  extends IrrigationEventBase {
  type: "irrigation_completed";
}

export type IrrigationEvent =
  | ScheduleDueEvent
  | ManualReminderSentEvent
  | AutomaticStartRequestedEvent
  | ControllerUnavailableEvent
  | IrrigationStartedEvent
  | IrrigationFailedEvent
  | IrrigationCompletedEvent;