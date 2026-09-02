import type {
  IrrigationControllerStatus,
  IrrigationDueAction,
  IrrigationExecutionRoute,
  IrrigationSchedule,
} from "@/features/irrigation/types/irrigation";

import {
  createIrrigationDueKey,
} from "@/features/irrigation/lib/create-irrigation-due-key";

import {
  resolveIrrigationDueDecision,
} from "@/features/irrigation/lib/resolve-irrigation-due-decision";

export type IrrigationDuePlan =
  | {
      status: "ready";
      farmId: string;
      scheduleId: string;
      scheduleRevision: number;
      duration: number;
      controllerStatus: IrrigationControllerStatus;
      route: IrrigationExecutionRoute;
      action: IrrigationDueAction;
      idempotencyKey: string;
    }
  | {
      status: "invalid-schedule";
      reason:
        | "missing-schedule-id"
        | "missing-schedule-revision";
    };

interface ResolveIrrigationDuePlanInput {
  farmId: string;
  schedule: IrrigationSchedule;
  controllerStatus: IrrigationControllerStatus;
}

export function resolveIrrigationDuePlan({
  farmId,
  schedule,
  controllerStatus,
}: ResolveIrrigationDuePlanInput): IrrigationDuePlan {
  if (!schedule.id) {
    return {
      status: "invalid-schedule",
      reason: "missing-schedule-id",
    };
  }

  if (
    !Number.isInteger(schedule.revision) ||
    !schedule.revision ||
    schedule.revision < 1
  ) {
    return {
      status: "invalid-schedule",
      reason: "missing-schedule-revision",
    };
  }

  const decision =
    resolveIrrigationDueDecision(
      controllerStatus,
    );

  const idempotencyKey =
    createIrrigationDueKey({
      farmId,
      scheduleId: schedule.id,
      scheduleRevision: schedule.revision,
    });

  return {
    status: "ready",
    farmId,
    scheduleId: schedule.id,
    scheduleRevision: schedule.revision,
    duration: schedule.duration,
    controllerStatus,
    route: decision.route,
    action: decision.action,
    idempotencyKey,
  };
}