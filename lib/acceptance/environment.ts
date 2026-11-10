import "server-only";

export const ACCEPTANCE_PROJECT = "lpkxwwdzuligovfgpfey";
const productionOrigin = "https://agromind.ir";

export function acceptanceSettings() {
  const enabled = process.env.AGROMIND_ACCEPTANCE_MODE === "true";
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!enabled) {
    if (projectUrl && new URL(projectUrl).hostname === ACCEPTANCE_PROJECT + ".supabase.co")
      throw new Error("ACCEPTANCE_MODE_REQUIRED");
    return null;
  }
  if (!projectUrl || new URL(projectUrl).origin !== "https://" + ACCEPTANCE_PROJECT + ".supabase.co")
    throw new Error("ACCEPTANCE_TARGET_REQUIRED");
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configured) throw new Error("ACCEPTANCE_ORIGIN_REQUIRED");
  const origin = new URL(configured);
  if (origin.protocol !== "https:" || origin.origin !== configured || origin.username || origin.password ||
      origin.hostname === "agromind.ir" || origin.hostname.endsWith(".agromind.ir"))
    throw new Error("ACCEPTANCE_ORIGIN_REQUIRED");
  return { origin: origin.origin };
}

export function emailOrigin() {
  return acceptanceSettings()?.origin ?? productionOrigin;
}

export function acceptanceMail(to: string, subject: string) {
  if (!acceptanceSettings()) return { from: "AgroMind <accounts@agromind.ir>", subject };
  // Mail stays closed until endpoint ownership and actual mailbox access are verified.
  const sender = process.env.AGROMIND_ACCEPTANCE_SENDER;
  const allowed = (process.env.AGROMIND_ACCEPTANCE_RECIPIENTS ?? "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
  if (process.env.AGROMIND_ACCEPTANCE_EMAIL_APPROVED !== "true" ||
      sender !== "onboarding@resend.dev" || !allowed.length || !allowed.includes(to.toLowerCase()))
    throw new Error("ACCEPTANCE_MAIL_NOT_APPROVED");
  return { from: "AgroMind STAGING <onboarding@resend.dev>", subject: "[STAGING] " + subject };
}
