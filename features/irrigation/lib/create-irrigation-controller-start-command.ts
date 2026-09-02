import {
  createIrrigationControllerCommandKey,
} from "@/features/irrigation/lib/create-irrigation-controller-command-key";

import type {
  IrrigationControllerStartCommand,
} from "@/features/irrigation/types/irrigation-controller-command";

interface CreateIrrigationControllerStartCommandInput {
  controllerId: string;
  farmId: string;
  scheduleId: string;
  scheduleRevision: number;
  duration: number;
  requestedAt: string;
}

export function createIrrigationControllerStartCommand({
  controllerId,
  farmId,
  scheduleId,
  scheduleRevision,
  duration,
  requestedAt,
}: CreateIrrigationControllerStartCommandInput): IrrigationControllerStartCommand {
  const idempotencyKey =
    createIrrigationControllerCommandKey({
      controllerId,
      farmId,
      scheduleId,
      scheduleRevision,
    });

  const commandId =
    `${idempotencyKey}:command`;

  return {
    type: "start-irrigation",
    commandId,
    idempotencyKey,
    controllerId,
    farmId,
    scheduleId,
    scheduleRevision,
    duration,
    requestedAt,
  };
}