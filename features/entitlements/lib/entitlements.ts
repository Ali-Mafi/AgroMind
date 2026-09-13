export type Entitlements = Record<string, number | boolean>;
export type Resource = "farms" | "sensors" | "team_members" | "ai_requests";
export type Capability =
  | "farm:create"
  | "irrigation:advanced"
  | "automation:use"
  | "analytics:advanced";
const LIMIT_KEYS: Record<Resource, string> = {
  farms: "max_farms",
  sensors: "max_sensors",
  team_members: "max_team_members",
  ai_requests: "ai_requests_per_month",
};
const CAPABILITY_KEYS: Record<Exclude<Capability, "farm:create">, string> = {
  "irrigation:advanced": "advanced_irrigation",
  "automation:use": "automation_access",
  "analytics:advanced": "advanced_analytics",
};
export function parseEntitlements(value: unknown): Entitlements {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, v]) =>
        typeof v === "boolean" ||
        (typeof v === "number" && Number.isSafeInteger(v) && v >= 0),
    ),
  );
}
export function getLimit(entitlements: Entitlements, resource: Resource) {
  const value = entitlements[LIMIT_KEYS[resource]];
  return typeof value === "number" ? value : 0;
}
export function can(
  subject: { entitlements: Entitlements; farmCount: number },
  capability: Capability,
) {
  return capability === "farm:create"
    ? subject.farmCount < getLimit(subject.entitlements, "farms")
    : subject.entitlements[CAPABILITY_KEYS[capability]] === true;
}
