import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { sessionCookieOptions } from "@/lib/supabase/config";

const EMAIL_COOKIE = "agromind_pending_email";
const USERNAME_COOKIE = "agromind_pending_username";
const WATCH_COOKIE = "agromind_pending_verification";
const NEXT_COOKIE = "agromind_pending_next";
const MAX_AGE = 60 * 60 * 24;

export type PendingSignup = {
  email: string;
  username: string;
  watchToken: string;
  next: string;
};

export function createVerificationWatch() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashVerificationWatch(token) };
}

export function hashVerificationWatch(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function rememberPendingSignup(input: PendingSignup) {
  const store = await cookies();
  const options = { ...sessionCookieOptions, maxAge: MAX_AGE };
  store.set(EMAIL_COOKIE, input.email, options);
  store.set(USERNAME_COOKIE, input.username, options);
  store.set(WATCH_COOKIE, input.watchToken, options);
  store.set(NEXT_COOKIE, input.next, options);
}

export async function readPendingSignup(): Promise<PendingSignup | null> {
  const store = await cookies();
  const email = store.get(EMAIL_COOKIE)?.value;
  const username = store.get(USERNAME_COOKIE)?.value;
  const watchToken = store.get(WATCH_COOKIE)?.value;
  const next = store.get(NEXT_COOKIE)?.value ?? "/dashboard";
  if (!email || !username || !watchToken) return null;
  return { email, username, watchToken, next };
}

export async function clearPendingSignup() {
  const store = await cookies();
  store.delete(EMAIL_COOKIE);
  store.delete(USERNAME_COOKIE);
  store.delete(WATCH_COOKIE);
  store.delete(NEXT_COOKIE);
}
