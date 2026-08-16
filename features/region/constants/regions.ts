import type { RegionConfig, SupportedRegion } from "@/features/region/types/region";

export const REGIONS: Record<SupportedRegion, RegionConfig> = {
  "fa-IR": {
    locale: "fa-IR",
    name: "Iran",
    calendar: "persian",
    direction: "rtl",
  },

  "en-US": {
    locale: "en-US",
    name: "United States",
    calendar: "gregory",
    direction: "ltr",
  },

  "en-GB": {
    locale: "en-GB",
    name: "United Kingdom",
    calendar: "gregory",
    direction: "ltr",
  },

  "zh-CN": {
    locale: "zh-CN",
    name: "China",
    calendar: "gregory",
    direction: "ltr",
  },

  "ja-JP": {
    locale: "ja-JP",
    name: "Japan",
    calendar: "gregory",
    direction: "ltr",
  },

  "th-TH": {
    locale: "th-TH",
    name: "Thailand",
    calendar: "buddhist",
    direction: "ltr",
  },
};

export const DEFAULT_REGION: SupportedRegion = "en-US";