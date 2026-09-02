import type {
  IrrigationControllerStatus,
  IrrigationExecutionRoute,
} from "@/features/irrigation/types/irrigation";

export function resolveIrrigationExecutionRoute(
  controllerStatus: IrrigationControllerStatus,
): IrrigationExecutionRoute {
  switch (controllerStatus) {
    case "not-connected":
      return "manual";

    case "connected":
      return "automatic";

    case "offline":
    case "error":
      return "unavailable";
  }

  const exhaustiveCheck: never =
    controllerStatus;

  return exhaustiveCheck;
}