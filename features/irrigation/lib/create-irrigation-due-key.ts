interface IrrigationDueKeyInput {
  farmId: string;
  scheduleId: string;
  scheduleRevision: number;
}

export function createIrrigationDueKey({
  farmId,
  scheduleId,
  scheduleRevision,
}: IrrigationDueKeyInput) {
  return [
    "irrigation",
    farmId,
    scheduleId,
    `revision-${scheduleRevision}`,
    "schedule-due",
  ].join(":");
}