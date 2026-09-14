"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { verifyMfaChallengeAction } from "../services/mfa-actions";
import type { MfaActionState } from "../types/mfa";

const initialState: MfaActionState = {};

export function MfaChallenge({ next }: { next: string }) {
  const t = useTranslation();
  const [state, action, pending] = useActionState(
    verifyMfaChallengeAction,
    initialState,
  );

  return (
    <form action={action} className="space-y-5">
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
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {t(state.error)}
        </p>
      )}
      <Button
        type="submit"
        disabled={pending}
        className="min-h-12 w-full rounded-xl"
      >
        {t(pending ? "Please wait…" : "Verify code")}
      </Button>
    </form>
  );
}
