import type { SupportedRegion } from "@/features/region/types/region";
import { REGION_PROFILES } from "@/features/settings/constants/region-profiles";

export function getRegionFromCountry(
  countryCode: string | null,
): SupportedRegion | null {
  if (!countryCode) {
    return null;
  }

  return REGION_PROFILES[countryCode.toUpperCase()]?.locale ?? null;
}
