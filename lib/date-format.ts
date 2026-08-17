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
  if (region === "fa-IR") {
    const parts = new Intl.DateTimeFormat(
      "fa-IR-u-ca-persian",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    ).formatToParts(date);

    const weekday =
      parts.find((part) => part.type === "weekday")?.value ?? "";

    const day =
      parts.find((part) => part.type === "day")?.value ?? "";

    const month =
      parts.find((part) => part.type === "month")?.value ?? "";

    const year =
      parts.find((part) => part.type === "year")?.value ?? "";

    return `${weekday}، ${day} ${month} ${year}`;
  }

  return new Intl.DateTimeFormat(
    getCalendarLocale(region),
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  ).format(date);
}

export function formatRegionalShortDate(
  date: Date,
): string {
  return new Intl.DateTimeFormat("en-US-u-ca-gregory", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}