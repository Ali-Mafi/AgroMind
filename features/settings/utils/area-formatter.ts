import type { AreaUnit } from "@/features/settings/context/settings-context";

export function formatArea(
  areaInSquareMeters: number,
  unit: AreaUnit,
): string {
  if (unit === "acre") return `${(areaInSquareMeters / 4046.8564224).toLocaleString()} ac`;
  if (unit === "hectare") {
    return `${(areaInSquareMeters / 10_000).toLocaleString()} ha`;
  }

  return `${areaInSquareMeters.toLocaleString()} m²`;
}
