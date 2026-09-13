import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { T } from "@/features/settings/components/translated-text";
import { currentUser, authenticatedDestination } from "../services/session";
import { tokenHashSchema } from "../lib/validation";
import { AuthShell } from "./auth-shell";
import { AuthForm } from "./auth-form";

export async function EmailEntry({
  kind,
  hash,
  status,
}: {
  kind: "verify" | "forgot" | "reset";
  hash?: string;
  status?: string;
}) {
  const user = await currentUser();
  const validHash = tokenHashSchema.safeParse(hash);
  if (kind === "forgot")
    return (
      <AuthShell
        title="Forgot password?"
        description="Enter your email and we will help you reset your password."
      >
        <AuthForm mode="forgot" />
        <BackToSignIn />
      </AuthShell>
    );
  if (kind === "verify" && user?.email_confirmed_at && !hash)
    return (
      <AuthShell
        title={
          status === "success"
            ? "Email verified"
            : "Your email is already verified"
        }
        description="Your account is ready. Continue to your farms."
      >
        <CheckCircle2 className="mx-auto mb-6 size-12 text-primary" />
        <Link
          href={(await authenticatedDestination()) ?? "/onboarding"}
          className={buttonVariants({
            className: "min-h-12 w-full rounded-xl",
          })}
        >
          <T text="Continue" />
        </Link>
      </AuthShell>
    );
  if (hash && validHash.success)
    return (
      <AuthShell
        title={kind === "reset" ? "Reset your password" : "Verify your email"}
        description="Continue below to securely open your email link."
      >
        <AuthForm
          mode={kind === "reset" ? "recovery" : "verify"}
          tokenHash={validHash.data}
        />
        <Link
          className="mt-5 inline-flex min-h-11 items-center text-sm text-primary"
          href={kind === "reset" ? "/forgot-password" : "/verify-email"}
        >
          <T text="Request a new email" />
        </Link>
      </AuthShell>
    );
  if (kind === "reset" && user && !hash && !status)
    return (
      <AuthShell
        title="Choose a new password"
        description="Use a unique password to keep your farms secure."
      >
        <AuthForm mode="reset" expectedUserId={user.id} />
      </AuthShell>
    );
  return (
    <AuthShell
      title={
        kind === "verify" ? "Check your inbox" : "Request a new password reset"
      }
      description={
        kind === "verify"
          ? "Verify your email to save your farms securely and continue onboarding."
          : "Open the link in your reset email to continue. You can request another email below."
      }
    >
      {(hash || status === "invalid" || status === "expired") && (
        <p
          role="alert"
          className="mb-5 rounded-xl bg-destructive/5 p-4 text-sm text-destructive"
        >
          <T
            text={
              status === "expired"
                ? "This link has expired or was already used. Request a new email."
                : "This link is invalid. Request a new email."
            }
          />
        </p>
      )}
      <AuthForm mode={kind === "verify" ? "resend" : "forgot"} />
      <BackToSignIn />
    </AuthShell>
  );
}
function BackToSignIn() {
  return (
    <Link
      className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-primary"
      href="/sign-in"
    >
      <T text="Back to sign in" />
    </Link>
  );
}
