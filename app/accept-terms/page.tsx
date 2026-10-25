import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/features/authentication/components/auth-shell";
import { GoogleTermsStep } from "@/features/authentication/components/google-terms-step";
import { safeNextPath } from "@/features/authentication/lib/redirects";
import { needsGoogleTerms } from "@/features/authentication/lib/terms-gate";
import { authenticatedDestination, currentUser, needsSecondFactor } from "@/features/authentication/services/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "AgroMind | Accept Terms",
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

  return <AuthShell title="Accept the Terms" description="Just one more step before you start.">
    <GoogleTermsStep next={safeNext} />
  </AuthShell>;
}
