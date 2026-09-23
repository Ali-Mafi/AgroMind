import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { T } from "@/features/settings/components/translated-text";
import { currentUser, needsSecondFactor } from "../services/session";
import { readPendingSignup } from "../lib/pending-signup";
import { tokenHashSchema } from "../lib/validation";
import { AuthShell } from "./auth-shell";
import { AuthForm } from "./auth-form";
import { VerificationPending } from "./verification-pending";

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
      <AuthShell title="Forgot password?" description="Enter your email and we will help you reset your password.">
        <AuthForm mode="forgot" />
        <SignInLink />
      </AuthShell>
    );

  if (kind === "verify" && status === "success")
    return (
      <AuthShell title="Email verified" description="Return to the AgroMind app to continue.">
        <CheckCircle2 className="mx-auto mb-6 size-12 text-primary" />
        <p className="text-center text-sm leading-6 text-muted-foreground">
          <T text="You can close this browser tab now." />
        </p>
      </AuthShell>
    );

  if (hash && validHash.success)
    return (
      <AuthShell
        title={kind === "reset" ? "Reset your password" : "Verify your email"}
        description="Continue below to securely open your email link."
      >
        <AuthForm mode={kind === "reset" ? "recovery" : "verify"} tokenHash={validHash.data} />
        <Link
          className="mt-5 inline-flex min-h-11 items-center text-sm text-primary"
          href={kind === "reset" ? "/forgot-password" : "/verify-email?status=resend"}
        >
          <T text="Request a new email" />
        </Link>
      </AuthShell>
    );

  if (kind === "reset" && user && !hash && !status) {
    if (await needsSecondFactor()) {
      redirect("/mfa?next=/reset-password");
    }
    return (
      <AuthShell title="Choose a new password" description="Use a unique password to keep your farms secure.">
        <AuthForm mode="reset" expectedUserId={user.id} />
      </AuthShell>
    );
  }

  if (kind === "verify") {
    const pending = await readPendingSignup();
    if (pending && status !== "resend")
      return (
        <AuthShell title="Check your inbox" description="Verify your email to continue setting up your AgroMind account.">
          {(status === "invalid" || status === "expired") && (
            <p role="alert" className="mb-5 rounded-xl bg-destructive/5 p-4 text-sm text-destructive">
              <T text={status === "expired" ? "This link has expired or was already used. Request a new email." : "This link is invalid. Request a new email."} />
            </p>
          )}
          <VerificationPending email={pending.email} />
          <SignInLink />
        </AuthShell>
      );

    return (
      <AuthShell title="Verify your email" description="Enter your signup email to request a new verification link.">
        <AuthForm mode="resend" />
        <SignInLink />
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Request a new password reset" description="Open the link in your reset email to continue. You can request another email below.">
      <AuthForm mode="forgot" />
      <SignInLink />
    </AuthShell>
  );
}

function SignInLink() {
  return (
    <Link className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-primary" href="/sign-in">
      <T text="Sign in" />
    </Link>
  );
}
