import type {
  IrrigationControllerStatus,
  IrrigationDueAction,
  IrrigationExecutionRoute,
} from "@/features/irrigation/types/irrigation";

import {
  resolveIrrigationDueAction,
} from "@/features/irrigation/lib/resolve-irrigation-due-action";

import {
  resolveIrrigationExecutionRoute,
} from "@/features/irrigation/lib/resolve-irrigation-execution";

export interface IrrigationDueDecision {
  route: IrrigationExecutionRoute;
  action: IrrigationDueAction;
}

export function resolveIrrigationDueDecision(
  controllerStatus: IrrigationControllerStatus,
): IrrigationDueDecision {
  const route =
    resolveIrrigationExecutionRoute(
      controllerStatus,
    );

  const action =
    resolveIrrigationDueAction(route);

  return {
    route,
    action,
  };
}