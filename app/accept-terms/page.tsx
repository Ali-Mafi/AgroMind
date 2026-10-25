import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/features/authentication/components/auth-shell";
import { cookies } from "next/headers";
import { DEFAULT_PREFERENCES, resolvePreferences } from "@/features/settings/lib/preferences";
import { PREFERENCES_COOKIE, preferencesFromCookie } from "@/features/settings/lib/preferences-cookie";
import { GOOGLE_TERMS_GATE } from "@/features/legal/content";
import { GoogleTermsStep } from "@/features/authentication/components/google-terms-step";
import { safeNextPath } from "@/features/authentication/lib/redirects";
import { needsGoogleTerms } from "@/features/authentication/lib/terms-gate";
import { authenticatedDestination, currentUser, needsSecondFactor } from "@/features/authentication/services/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "AgroMind | " + GOOGLE_TERMS_GATE.en.title,
  robots: { index: false, follow: false },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = safeNextPath(next);
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  if (!user.email_confirmed_at) redirect("/verify-email");
  if (await needsSecondFactor())
    redirect(`/mfa?next=${encodeURIComponent(safeNext)}`);
  if (!needsGoogleTerms(user))
    redirect((await authenticatedDestination(safeNext)) ?? "/sign-in");

  const prefs = preferencesFromCookie((await cookies()).get(PREFERENCES_COOKIE)?.value);
  const language = resolvePreferences(prefs ?? DEFAULT_PREFERENCES).language === "fa" ? "fa" : "en";
  const copy = GOOGLE_TERMS_GATE[language];
  return <AuthShell title={copy.title} description={copy.description}>
    <GoogleTermsStep next={safeNext} />
  </AuthShell>;
}
