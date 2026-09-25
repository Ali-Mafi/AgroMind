const PREVIEW_SUPABASE = {
  url: "https://gedwexwxaojpqyeiebwm.supabase.co",
  key: "sb_publishable_jBFKMxpEJP3a7aLJgvkbPQ_RiYoFoPD",
} as const;

function configuredValues() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (url && key) return { url, key };

  // Preview deployments currently do not receive the project's Supabase
  // environment variables. The publishable key is public by design and this
  // fallback is branch-test scaffolding only; remove it before merging.
  if (process.env.VERCEL_ENV === "preview") return PREVIEW_SUPABASE;

  return null;
}

export function isSupabaseConfigured() {
  return Boolean(configuredValues());
}

export function supabaseConfig() {
  const configured = configuredValues();
  if (!configured)
    throw new Error("Account services are temporarily unavailable.");
  return configured;
}

export const sessionCookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  // Auth and database operations run on the server. Browser code receives DTOs,
  // never tokens, and does not instantiate a Supabase auth client.
  httpOnly: true,
};
