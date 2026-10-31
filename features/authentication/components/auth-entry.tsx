import Link from "next/link";
import { redirect } from "next/navigation";
import { T } from "@/features/settings/components/translated-text";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeNextPath } from "../lib/redirects";
import { authenticatedDestination } from "../services/session";
import { AuthShell } from "./auth-shell";
import { AuthForm } from "./auth-form";
import { OAuthSignIn } from "./oauth-sign-in";
import { SignupConsentProvider } from "@/features/legal/components/signup-consent";

export async function AuthEntry({
  mode,
  next,
  status,
}: {
  mode: "login" | "signup";
  next?: string;
  status?: string;
}) {
  const destination = await authenticatedDestination(next);
  if (destination) redirect(destination);
  const signup = mode === "signup";
  const nextPath = safeNextPath(next);
  const alternateHref =
    nextPath === "/dashboard"
      ? signup
        ? "/sign-in"
        : "/sign-up"
      : `${signup ? "/sign-in" : "/sign-up"}?next=${encodeURIComponent(nextPath)}`;
  return (
    <AuthShell
      title={signup ? "Create your account" : "Welcome back"}
      description={
        signup
          ? "Your farms and gardens, together in AgroMind."
          : "Sign in with your username or email."
      }
    >
      {status === "password-updated" && (
        <p role="status" className="mb-5 rounded-xl bg-primary/10 p-4 text-sm">
          <T text="Password updated. Sign in with your new password." />
        </p>
      )}
      {status === "revocation-pending" && (
        <p role="alert" className="mb-5 rounded-xl bg-primary/10 p-4 text-sm">
          <T text="Session access is blocked, but provider sign-out could not be confirmed. Sign in again and use a new authenticator code to complete sign-out." />
        </p>
      )}
      {status === "password-updated-pending" && (
        <p role="alert" className="mb-5 rounded-xl bg-primary/10 p-4 text-sm">
          <T text="Your password was updated and AgroMind sessions were blocked, but native provider sign-out is not yet confirmed. Sign in again with your new password to review security." />
        </p>
      )}
      {status === "password-updated-audit-pending" && (
        <p role="alert" className="mb-5 rounded-xl bg-primary/10 p-4 text-sm">
          <T text="Your password was updated and native sessions were signed out, but the security activity confirmation could not be recorded. Sign in with your new password." />
        </p>
      )}
      {status === "password-updated-checks-pending" && (
        <p role="alert" className="mb-5 rounded-xl bg-primary/10 p-4 text-sm">
          <T text="Your password was updated and AgroMind access was blocked. Neither native sign-out nor security activity confirmation could be verified. Sign in again and review your account security." />
        </p>
      )}
      {status === "password-rejected" && (
        <p role="alert" className="mb-5 rounded-xl bg-primary/10 p-4 text-sm">
          <T text="The provider rejected the new password. Previous AgroMind sessions were restricted and sign-out completed. Sign in again using your existing method; supply any required current password or email code on your next attempt." />
        </p>
      )}
      {status === "password-rejected-signout-pending" && (
        <p role="alert" className="mb-5 rounded-xl bg-primary/10 p-4 text-sm">
          <T text="The provider rejected the new password. AgroMind sessions were restricted, but native sign-out was not confirmed. Sign in with your existing method or use account recovery." />
        </p>
      )}
      {status === "password-rejected-record-pending" && (
        <p role="alert" className="mb-5 rounded-xl bg-primary/10 p-4 text-sm">
          <T text="The provider rejected the new password, and its security outcome could not be recorded. Previous AgroMind sessions were restricted. Sign in again or use verified account recovery." />
        </p>
      )}
      {status === "password-update-unknown" && (
        <p role="alert" className="mb-5 rounded-xl bg-primary/10 p-4 text-sm">
          <T text="Password change could not be confirmed. Previous AgroMind sessions were restricted. Sign in with the password you believe is current, or use verified account recovery." />
        </p>
      )}
      {status === "email-verified" && (
        <p role="status" className="mb-5 rounded-xl bg-primary/10 p-4 text-sm">
          <T text="Email verified. Sign in to continue in AgroMind." />
        </p>
      )}
      {status === "oauth-error" && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm leading-6 text-destructive"
        >
          <T text="Google sign-in could not be completed. Please try again or continue with email." />
        </p>
      )}
      {isSupabaseConfigured() ? (
        signup ? (
          <>
            <OAuthSignIn next={next} source="signup" />
            <SignupConsentProvider>
              <AuthForm mode="sign-up" next={next} />
            </SignupConsentProvider>
          </>
        ) : (
          <>
            <OAuthSignIn next={next} source="login" />
            <AuthForm mode="sign-in" next={next} />
          </>
        )
      ) : (
        <p role="status" className="rounded-xl bg-primary/5 p-4 text-sm leading-6">
          <T text="Account services are temporarily unavailable. Please try again." />
        </p>
      )}
      {!signup && (
        <div className="mt-4 flex flex-wrap justify-between gap-x-4 text-sm text-primary">
          <Link className="inline-flex min-h-11 items-center hover:underline" href="/forgot-password">
            <T text="Forgot password?" />
          </Link>
        </div>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <T text={signup ? "Already have an account?" : "New to AgroMind?"} />{" "}
        <Link
          href={alternateHref}
          className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline"
        >
          <T text={signup ? "Sign In" : "Sign up"} />
        </Link>
      </p>
    </AuthShell>
  );
}
