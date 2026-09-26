import Link from "next/link";
import { redirect } from "next/navigation";
import { T } from "@/features/settings/components/translated-text";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeNextPath } from "../lib/redirects";
import { authenticatedDestination } from "../services/session";
import { AuthShell } from "./auth-shell";
import { AuthForm } from "./auth-form";
import { OAuthSignIn } from "./oauth-sign-in";

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
        <>
          <OAuthSignIn next={next} source={signup ? "signup" : "login"} />
          <AuthForm mode={signup ? "sign-up" : "sign-in"} next={next} />
        </>
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
