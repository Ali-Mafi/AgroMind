interface IrrigationControllerCommandKeyInput {
  controllerId: string;
  farmId: string;
  scheduleId: string;
  scheduleRevision: number;
}

export function createIrrigationControllerCommandKey({
  controllerId,
  farmId,
  scheduleId,
  scheduleRevision,
}: IrrigationControllerCommandKeyInput) {
  return [
    "irrigation",
    "controller",
    controllerId,
    "farm",
    farmId,
    "schedule",
    scheduleId,
    `revision-${scheduleRevision}`,
    "start-irrigation",
  ].join(":");
}