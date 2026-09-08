export const IRRIGATION_TYPES = [
  {
    value: "flood",
    label: "Flood Irrigation",
  },
  {
    value: "drip",
    label: "Drip Irrigation",
  },
  {
    value: "sprinkler",
    label: "Sprinkler Irrigation",
  },
  {
    value: "other",
    label: "Other",
  },
] as const;

export type IrrigationType =
  (typeof IRRIGATION_TYPES)[number]["value"];

export function getIrrigationTypeLabel(
  value?: string,
): string {
  if (!value) {
    return "Not specified";
  }

  const normalized = normalizeIrrigationType(value);

  if (!normalized) {
    return "Not specified";
  }

  return (
    IRRIGATION_TYPES.find(
      (type) => type.value === normalized,
    )?.label ?? "Not specified"
  );
}

export function normalizeIrrigationType(
  value?: string,
): IrrigationType | "" {
  if (!value) {
    return "";
  }

  const normalizedValue = value
    .trim()
    .toLowerCase();

  switch (normalizedValue) {
    case "flood":
    case "flood irrigation":
      return "flood";

    case "drip":
    case "drip irrigation":
      return "drip";

    case "sprinkler":
    case "sprinkler irrigation":
      return "sprinkler";

    case "other":
      return "other";

    default:
      return "";
  }
}