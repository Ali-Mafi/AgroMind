import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { siteOrigin } from "../lib/redirects";

const requestLifetime = 5 * 60 * 1000;
const linkLifetime = 60 * 60 * 1000;
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

function mac(purpose: string, ...values: string[]) {
  const key = process.env.SUPABASE_AUTH_EMAIL_HOOK_SECRET;
  if (!key) throw new Error("Recovery email is unavailable.");
  return createHmac("sha256", key)
    .update(JSON.stringify([purpose, siteOrigin(), ...values]))
    .digest("hex");
}

function validTime(value: string, lifetime: number) {
  const age = Date.now() - Number(value);
  return /^\d{13}$/.test(value) && age >= 0 && age < lifetime;
}

function matches(signature: string, expected: string) {
  return /^[0-9a-f]{64}$/.test(signature) &&
    timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
}

export function recoveryRequestUrl(email: string) {
  const url = new URL("/auth/callback", siteOrigin());
  const time = String(Date.now());
  url.searchParams.set("next", "/reset-password");
  url.searchParams.set("request", time + "." + mac("recovery-request", time, email.toLowerCase()));
  return url.toString();
}

// Called only after the Send Email Hook signature and recovery event have been verified.
export function attestRecoveryEmail(
  redirectTo: string | undefined,
  email: string,
  userId: string | undefined,
  tokenHash: string,
) {
  if (!redirectTo || !URL.canParse(redirectTo) || !userId || !uuid.test(userId))
    return null;
  const url = new URL(redirectTo);
  if (url.origin !== siteOrigin() || url.pathname !== "/auth/callback" ||
      url.searchParams.get("next") !== "/reset-password") return null;

  const [time, signature = "", extra] = (url.searchParams.get("request") ?? "").split(".");
  if (extra !== undefined || !validTime(time, requestLifetime) ||
      !matches(signature, mac("recovery-request", time, email.toLowerCase()))) return null;

  return [time, userId, mac("recovery-link", time, userId, tokenHash)].join(".");
}

export function readRecoveryEmail(tokenHash: string, proof: unknown) {
  if (typeof proof !== "string" || proof.length > 120) return null;
  const [time, userId = "", signature = "", extra] = proof.split(".");
  if (extra !== undefined || !uuid.test(userId) || !validTime(time, linkLifetime) ||
      !process.env.SUPABASE_AUTH_EMAIL_HOOK_SECRET ||
      !matches(signature, mac("recovery-link", time, userId, tokenHash))) return null;

  return { userId, emailProofHash: mac("recovery-token", userId, tokenHash) };
}
