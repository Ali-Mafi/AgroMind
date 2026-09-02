import type {
  IrrigationDueAction,
  IrrigationExecutionRoute,
} from "@/features/irrigation/types/irrigation";

export function resolveIrrigationDueAction(
  route: IrrigationExecutionRoute,
): IrrigationDueAction {
  switch (route) {
    case "manual":
      return "send-manual-reminder";

    case "automatic":
      return "request-automatic-start";

    case "unavailable":
      return "report-controller-unavailable";
  }

  const exhaustiveCheck: never = route;

  return exhaustiveCheck;
}