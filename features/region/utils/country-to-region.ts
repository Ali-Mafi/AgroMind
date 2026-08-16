import type { SupportedRegion } from "@/features/region/types/region";

const COUNTRY_TO_REGION: Record<
  string,
  SupportedRegion
> = {
  IR: "fa-IR",
  US: "en-US",
  GB: "en-GB",
  CN: "zh-CN",
  JP: "ja-JP",
  TH: "th-TH",
};

export function getRegionFromCountry(
  countryCode: string | null,
): SupportedRegion | null {
  if (!countryCode) {
    return null;
  }

  return COUNTRY_TO_REGION[countryCode.toUpperCase()] ?? null;
}