"use client";

import Image from "next/image";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import {
  beginTotpEnrollmentAction,
  disableTotpAction,
  verifyTotpEnrollmentAction,
} from "@/features/authentication/services/mfa-actions";
import type {
  MfaActionState,
  MfaSecurityState,
} from "@/features/authentication/types/mfa";
import { AccountShell, accountCardClass } from "./account-shell";

type Setup = {
  factorId: string;
  qrCode: string;
  secret: string;
};

export function SecurityCenter({
  initialState,
}: {
  initialState: MfaSecurityState;
}) {
  const t = useTranslation();
  const router = useRouter();
  const [setup, setSetup] = useState<Setup | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<MfaActionState>({});
  const [confirmDisable, setConfirmDisable] = useState(false);

  async function startSetup() {
    if (busy) return;
    setBusy(true);
    setMessage({});
    try {
      const result = await beginTotpEnrollmentAction();
      if ("error" in result) {
        setMessage({ error: result.error });
        return;
      }
      setSetup(result);
    } finally {
      setBusy(false);
    }
  }

  async function verifySetup(form: FormData) {
    if (busy) return;
    setBusy(true);
    setMessage({});
    try {
      const result = await verifyTotpEnrollmentAction({}, form);
      setMessage(result);
      if (result.success) {
        setSetup(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function disable(form: FormData) {
    if (busy) return;
    setBusy(true);
    setMessage({});
    try {
      const result = await disableTotpAction({}, form);
      setMessage(result);
      if (result.success) {
        setConfirmDisable(false);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AccountShell title="Security">
      <section className={accountCardClass}>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            {initialState.enabled ? <ShieldCheck /> : <ShieldOff />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-xl font-bold">
              {t("Authenticator app")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t(
                "Use Google Authenticator, 1Password, Authy, or another TOTP app for an extra sign-in step.",
              )}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-background/70 p-4">
          <p className="font-semibold">
            {t(
              initialState.enabled
                ? "Two-step verification is on"
                : "Two-step verification is off",
            )}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(
              initialState.enabled
                ? "After your password, AgroMind will ask for a 6-digit code from your authenticator app."
                : "Enable it to protect your account even if your password is compromised.",
            )}
          </p>
        </div>

        {!initialState.enabled && !setup && (
          <Button
            className="min-h-11 w-fit rounded-xl"
            disabled={busy}
            onClick={startSetup}
          >
            {t(busy ? "Please wait…" : "Set up authenticator")}
          </Button>
        )}

        {!initialState.enabled && setup && (
          <div className="space-y-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
            <div>
              <h3 className="font-bold">{t("Scan the QR code")}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t(
                  "Open Google Authenticator, tap Add account, then scan this QR code.",
                )}
              </p>
            </div>

            <div className="mx-auto w-fit rounded-2xl bg-white p-3 shadow-sm">
              <Image
                src={setup.qrCode}
                alt={t("Authenticator QR code")}
                width={220}
                height={220}
                unoptimized
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">{t("Cannot scan it?")}</p>
              <p className="text-sm text-muted-foreground">
                {t("Enter this setup key manually in your authenticator app.")}
              </p>
              <code className="block select-all break-all rounded-xl border bg-background p-3 text-sm" dir="ltr">
                {setup.secret}
              </code>
            </div>

            <form action={verifySetup} className="space-y-3">
              <input type="hidden" name="factor_id" value={setup.factorId} />
              <label htmlFor="mfa-enrollment-code" className="block text-sm font-semibold">
                {t("6-digit code")}
              </label>
              <input
                id="mfa-enrollment-code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                dir="ltr"
                className="min-h-12 w-full rounded-xl border bg-background px-4 py-3 text-center text-lg tracking-[0.3em] outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
              />
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={busy} className="min-h-11 rounded-xl">
                  {t(busy ? "Please wait…" : "Verify and enable")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  className="min-h-11 rounded-xl"
                  onClick={() => {
                    setSetup(null);
                    setMessage({});
                  }}
                >
                  {t("Cancel")}
                </Button>
              </div>
            </form>
          </div>
        )}

        {initialState.enabled && (
          <div className="space-y-4">
            {initialState.factors.map((factor) => (
              <div key={factor.id} className="rounded-2xl border bg-background/70 p-4">
                <p className="font-semibold">{factor.friendlyName}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("Verified authenticator factor")}
                </p>
              </div>
            ))}

            {!confirmDisable ? (
              <Button
                variant="outline"
                className="min-h-11 rounded-xl"
                onClick={() => setConfirmDisable(true)}
              >
                {t("Disable authenticator")}
              </Button>
            ) : (
              <div className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
                <p className="font-semibold">{t("Disable two-step verification?")}</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t(
                    "Your account will return to password-only sign in until you enable an authenticator again.",
                  )}
                </p>
                <form action={disable} className="flex flex-wrap gap-3">
                  <input
                    type="hidden"
                    name="factor_id"
                    value={initialState.factors[0]?.id ?? ""}
                  />
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={busy}
                    className="min-h-11 rounded-xl"
                  >
                    {t(busy ? "Please wait…" : "Confirm disable")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    className="min-h-11 rounded-xl"
                    onClick={() => setConfirmDisable(false)}
                  >
                    {t("Keep enabled")}
                  </Button>
                </form>
              </div>
            )}
          </div>
        )}

        {message.error && (
          <p role="alert" className="text-sm text-destructive">
            {t(message.error)}
          </p>
        )}
        {message.success && (
          <p role="status" className="text-sm font-medium text-primary">
            {t(message.success)}
          </p>
        )}
      </section>
    </AccountShell>
  );
}
