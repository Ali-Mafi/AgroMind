export type SupportedRegion = string;

export interface RegionConfig {
  locale: SupportedRegion;
  name: string;
  calendar: string;
  direction: "ltr" | "rtl";
}
