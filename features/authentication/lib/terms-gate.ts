import { REVIEWED_ON } from "@/features/legal/content";

export type TermsGateUser = {
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
  identities?: Array<{ provider?: string }> | null;
};

// Google OAuth can create an account even when started on the sign-in page.
// Gate both login and signup when an account has not yet accepted this revision.
export function needsGoogleTerms(user: TermsGateUser | null | undefined): boolean {
  if (!user) return false;
  const providers = user.app_metadata?.providers;
  const google = user.app_metadata?.provider === "google" ||
    (Array.isArray(providers) && providers.includes("google")) ||
    user.identities?.some(identity => identity.provider === "google") === true;
  return google && user.user_metadata?.terms_accepted_version !== REVIEWED_ON;
}
