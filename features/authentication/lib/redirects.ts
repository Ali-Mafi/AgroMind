const PRIVATE_PATH =
  /^\/(dashboard|assistant|farms|irrigation|account|settings|weather|onboarding|invite)(\/|$)/;
export function isPrivatePath(path: string) {
  return PRIVATE_PATH.test(path);
}
export function safeNextPath(value: unknown, fallback = "/dashboard") {
  if (
    typeof value !== "string" ||
    !/^\/[A-Za-z0-9_/-]*$/.test(value) ||
    value.includes("//") ||
    !isPrivatePath(value)
  )
    return fallback;
  return value;
}
export function safeMfaNextPath(value: unknown) {
  if (value === "/reset-password") return "/reset-password";
  return safeNextPath(value);
}

export function siteOrigin() {
  const previewHost =
    process.env.VERCEL_ENV === "preview"
      ? process.env.VERCEL_BRANCH_URL
      : undefined;
  const configured = previewHost
    ? `https://${previewHost}`
    : process.env.NEXT_PUBLIC_SITE_URL || "https://agromind.ir";
  const url = new URL(configured);

  const localDevelopment =
    process.env.NODE_ENV !== "production" &&
    ["localhost", "127.0.0.1"].includes(url.hostname);
  const trustedPreview =
    process.env.VERCEL_ENV === "preview" &&
    Boolean(previewHost) &&
    url.protocol === "https:" &&
    url.hostname === previewHost &&
    url.hostname.endsWith(".vercel.app");

  if (
    url.username ||
    url.password ||
    (url.protocol !== "https:" && !localDevelopment) ||
    (process.env.VERCEL_ENV === "preview" && !trustedPreview)
  ) {
    throw new Error("Invalid site URL configuration.");
  }

  return url.origin;
}
