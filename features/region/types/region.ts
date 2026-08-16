export type SupportedRegion =
  | "fa-IR"
  | "en-US"
  | "en-GB"
  | "zh-CN"
  | "ja-JP"
  | "th-TH";

export interface RegionConfig {
  locale: SupportedRegion;
  name: string;
  calendar: string;
  direction: "ltr" | "rtl";
}