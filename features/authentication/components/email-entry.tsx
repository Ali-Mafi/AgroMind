import Link from "next/link";
import { cookies } from "next/headers";
import { CheckCircle2 } from "lucide-react";
import { T } from "@/features/settings/components/translated-text";
import { isSupabaseConfigured, supabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { pendingMfaCancellationCookie, sessionCookieName } from "@/lib/supabase/session-cookies";
import { readPasswordRecovery } from "../services/password-recovery";
import { readRecoveryEmail } from "../services/recovery-email-proof";
import { readPendingSignup } from "../lib/pending-signup";
import { tokenHashSchema } from "../lib/validation";
import { AuthShell } from "./auth-shell";
import { AuthForm } from "./auth-form";
import { MfaCancelForm } from "./mfa-cancel-form";
import { VerificationPending } from "./verification-pending";

export async function EmailEntry({
  kind,
  hash,
  status,
  proof,
}: {
  kind: "verify" | "forgot" | "reset";
  hash?: string;
  status?: string;
  proof?: string;
}) {
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

  if (validHash.success && (kind === "verify" || readRecoveryEmail(validHash.data, proof)))
    return (
      <AuthShell
        title={kind === "reset" ? "Reset your password" : "Verify your email"}
        description="Continue below to securely open your email link."
      >
        <AuthForm
          mode={kind === "reset" ? "recovery" : "verify"}
          tokenHash={validHash.data}
          recoveryProof={kind === "reset" ? proof : undefined}
        />
        <Link
          className="mt-5 inline-flex min-h-11 items-center text-sm text-primary"
          href={kind === "reset" ? "/forgot-password" : "/verify-email?status=resend"}
        >
          <T text="Request a new email" />
        </Link>
      </AuthShell>
    );

  if (kind === "reset" && !hash && !status && isSupabaseConfigured()) {
    const recovery = await readPasswordRecovery(await createClient()).catch(() => null);
    if (recovery) {
      const factors = recovery.user.factors?.filter((factor) => factor.status === "verified") ?? [];
      const authenticators = factors.filter((factor) => factor.factor_type === "totp");
      const cancellation = recovery.aal === "aal1"
        ? await pendingMfaCancellationCookie(
            (await cookies()).getAll(), sessionCookieName(supabaseConfig().url),
          )
        : null;
      return (
        <AuthShell
          title="Choose a new password"
          description="Use a unique password to keep your farms secure."
          backForm={cancellation ? "recovery-cancel" : undefined}
        >
          {factors.length > 0 && authenticators.length === 0 ? (
            <p role="alert" className="text-sm text-destructive">
              <T text="No authenticator factor is available for this account." />
            </p>
          ) : (
            <AuthForm
              mode="reset"
              recoveryAttempt={recovery.attempt}
              authenticators={authenticators.map((factor) => ({
                id: factor.id,
                name: factor.friendly_name,
              }))}
            />
          )}
          {cancellation && <MfaCancelForm id="recovery-cancel" attempt={cancellation} recovery />}
          <Link className="mt-5 inline-flex min-h-11 items-center text-sm text-primary" href="/forgot-password">
            <T text="Request a new email" />
          </Link>
        </AuthShell>
      );
    }
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
          <VerificationPending email={pending.email} next={pending.next} />
          <SignInLink next={pending.next} />
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

function SignInLink({ next }: { next?: string } = {}) {
  const href =
    next && next !== "/dashboard"
      ? `/sign-in?next=${encodeURIComponent(next)}`
      : "/sign-in";
  return (
    <Link className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-primary" href={href}>
      <T text="Sign in" />
    </Link>
  );
}
