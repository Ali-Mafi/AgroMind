"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import {
  verifyMfaChallengeAction,
  verifyRecoveryCodeAction,
} from "../services/mfa-actions";
import type { MfaActionState } from "../types/mfa";

const initialState: MfaActionState = {};

export function MfaChallenge({
  next,
  recoveryCodesEnabled = false,
}: {
  next: string;
  recoveryCodesEnabled?: boolean;
}) {
  const t = useTranslation();
  const [mode, setMode] = useState<"authenticator" | "backup">("authenticator");
  const [totpState, totpAction, totpPending] = useActionState(
    verifyMfaChallengeAction,
    initialState,
  );
  const [backupState, backupAction, backupPending] = useActionState(
    verifyRecoveryCodeAction,
    initialState,
  );

  if (mode === "backup") {
    return (
      <form action={backupAction} className="space-y-5">
        <input type="hidden" name="next" value={next} />
        <div className="space-y-2">
          <label htmlFor="mfa-recovery-code" className="block text-sm font-semibold">
            {t("Backup code")}
          </label>
          <input
            id="mfa-recovery-code"
            name="recovery_code"
            type="text"
            autoComplete="one-time-code"
            autoCapitalize="none"
            spellCheck={false}
            required
            autoFocus
            dir="ltr"
            className="min-h-12 w-full rounded-xl border bg-background px-4 py-3 text-center text-base tracking-wider outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
          />
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {t("Enter one of your unused backup codes. Each code can be used only once.")}
        </p>
        {backupState.error && (
          <p role="alert" className="text-sm text-destructive">
            {t(backupState.error)}
          </p>
        )}
        <Button
          type="submit"
          disabled={backupPending}
          className="min-h-12 w-full rounded-xl"
        >
          {t(backupPending ? "Please wait…" : "Verify backup code")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 w-full rounded-xl"
          onClick={() => setMode("authenticator")}
        >
          {t("Use authenticator code")}
        </Button>
      </form>
    );
  }

  return (
    <form action={totpAction} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-2">
        <label htmlFor="mfa-code" className="block text-sm font-semibold">
          {t("6-digit code")}
        </label>
        <input
          id="mfa-code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoFocus
          dir="ltr"
          className="min-h-12 w-full rounded-xl border bg-background px-4 py-3 text-center text-lg tracking-[0.3em] outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
        />
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        {t("Open your authenticator app and enter the newest code for AgroMind.")}
      </p>
      {totpState.error && (
        <p role="alert" className="text-sm text-destructive">
          {t(totpState.error)}
        </p>
      )}
      <Button
        type="submit"
        disabled={totpPending}
        className="min-h-12 w-full rounded-xl"
      >
        {t(totpPending ? "Please wait…" : "Verify code")}
      </Button>
      {recoveryCodesEnabled && (
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 w-full rounded-xl"
          onClick={() => setMode("backup")}
        >
          {t("Use a backup code")}
        </Button>
      )}
    </form>
  );
}
