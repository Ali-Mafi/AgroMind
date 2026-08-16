import type { SupportedRegion } from "@/features/region/types/region";

function getCalendarLocale(region: SupportedRegion) {
  switch (region) {
    case "fa-IR":
      return "fa-IR-u-ca-persian";

    case "th-TH":
      return "th-TH-u-ca-buddhist";

    case "zh-CN":
      return "zh-CN-u-ca-gregory";

    case "ja-JP":
      return "ja-JP-u-ca-gregory";

    case "en-GB":
      return "en-GB-u-ca-gregory";

    case "en-US":
    default:
      return "en-US-u-ca-gregory";
  }
}

export function formatRegionalDate(
  date: Date,
  region: SupportedRegion,
): string {
  return new Intl.DateTimeFormat(getCalendarLocale(region), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatRegionalShortDate(
  date: Date,
  region: SupportedRegion,
): string {
  return new Intl.DateTimeFormat(getCalendarLocale(region), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}