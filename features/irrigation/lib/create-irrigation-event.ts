import type {
  IrrigationControllerStatus,
} from "@/features/irrigation/types/irrigation";

import type {
  IrrigationEvent,
} from "@/features/irrigation/types/irrigation-events";

interface IrrigationEventContext {
  farmId: string;
  scheduleId: string;
  scheduleRevision: number;
}

type IrrigationEventDetails =
  | {
      type: "schedule_due";
    }
  | {
      type: "manual_reminder_sent";
    }
  | {
      type: "automatic_start_requested";
      duration: number;
    }
  | {
      type: "controller_unavailable";
      controllerStatus: Extract<
        IrrigationControllerStatus,
        "offline" | "error"
      >;
    }
  | {
      type: "irrigation_started";
    }
  | {
      type: "irrigation_failed";
      reason: string;
    }
  | {
      type: "irrigation_completed";
    };

interface IrrigationEventFactoryDependencies {
  createId?: () => string;
  now?: () => Date;
}

export function createIrrigationEvent(
  context: IrrigationEventContext,
  details: IrrigationEventDetails,
  dependencies: IrrigationEventFactoryDependencies = {},
): IrrigationEvent {
  const id =
    dependencies.createId?.() ??
    globalThis.crypto.randomUUID();

  const occurredAt = (
    dependencies.now?.() ?? new Date()
  ).toISOString();

  const base = {
    id,
    farmId: context.farmId,
    scheduleId: context.scheduleId,
    scheduleRevision:
        context.scheduleRevision,
    occurredAt,
    };

  switch (details.type) {
    case "schedule_due":
      return {
        ...base,
        type: "schedule_due",
      };

    case "manual_reminder_sent":
      return {
        ...base,
        type: "manual_reminder_sent",
      };

    case "automatic_start_requested":
      return {
        ...base,
        type: "automatic_start_requested",
        duration: details.duration,
      };

    case "controller_unavailable":
      return {
        ...base,
        type: "controller_unavailable",
        controllerStatus:
          details.controllerStatus,
      };

    case "irrigation_started":
      return {
        ...base,
        type: "irrigation_started",
      };

    case "irrigation_failed":
      return {
        ...base,
        type: "irrigation_failed",
        reason: details.reason,
      };

    case "irrigation_completed":
      return {
        ...base,
        type: "irrigation_completed",
      };
  }

  const exhaustiveCheck: never = details;

  return exhaustiveCheck;
}