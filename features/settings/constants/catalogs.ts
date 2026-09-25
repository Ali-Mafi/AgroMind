import { WORKSPACE_PERSIAN } from "./workspace-persian";
import { ACCOUNT_PERSIAN } from "./account-persian";
import { AUTH_STABILIZATION_PERSIAN } from "./auth-stabilization-persian";
import { COMMON_PERSIAN } from "./common-persian";
import { SECURITY_PERSIAN } from "./security-persian";
import { MFA_PERSIAN } from "./mfa-persian";
import { PERSIAN } from "./persian";
import { WEATHER_PERSIAN } from "./weather-persian";
import { LANDING_PERSIAN } from "./landing-persian";

const persianValues: Record<string, string> = {
  ...WEATHER_PERSIAN,
  ...COMMON_PERSIAN,
  ...PERSIAN,
  ...ACCOUNT_PERSIAN,
  ...AUTH_STABILIZATION_PERSIAN,
  ...MFA_PERSIAN,
  ...SECURITY_PERSIAN,
  ...WORKSPACE_PERSIAN,
  ...LANDING_PERSIAN,
};

export const CANONICAL_KEYS = Object.freeze(Object.keys(persianValues).sort());
export const ENGLISH_CATALOG: Record<string, string> = Object.fromEntries(CANONICAL_KEYS.map((key) => [key, key]));
export const PERSIAN_CATALOG: Record<string, string> = Object.fromEntries(CANONICAL_KEYS.map((key) => [key, persianValues[key]]));
export const LOCALE_CATALOGS: Record<string, Record<string, string>> = {
  en: ENGLISH_CATALOG,
  fa: PERSIAN_CATALOG,
};
