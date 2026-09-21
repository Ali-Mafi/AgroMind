"use client";
import { useId, useState } from "react";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import type { MfaSecurityState } from "../types/mfa";

export function FreshIdentityFields({ state }: { state: MfaSecurityState }) {
  const t = useTranslation();
  const id = useId();
  const [recovery, setRecovery] = useState(false);
  const inputClass =
    "min-h-11 w-full rounded-xl border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/25";
  return (
    <fieldset className="space-y-3 rounded-xl border p-4">
      <legend className="px-1 text-sm font-semibold">
        {t("Confirm your identity")}
      </legend>
      <p className="text-sm text-muted-foreground">
        {t("A fresh confirmation is required for this action.")}
      </p>
      {state.enabled ? (
        <>
          <input
            type="hidden"
            name="proof_method"
            value={recovery ? "recovery" : "totp"}
          />
          {recovery ? (
            <>
              <label htmlFor={`${id}-recovery`} className="block text-sm">
                {t("Backup code")}
              </label>
              <input
                id={`${id}-recovery`}
                name="fresh_recovery_code"
                required
                maxLength={128}
                autoComplete="one-time-code"
                dir="ltr"
                className={inputClass}
              />
            </>
          ) : (
            <>
              <label htmlFor={`${id}-factor`} className="block text-sm">
                {t("Authenticator")}
              </label>
              <select
                id={`${id}-factor`}
                name="proof_factor_id"
                className={inputClass}
                defaultValue={state.factors[0]?.id}
                required
              >
                {state.factors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.friendlyName}
                  </option>
                ))}
              </select>
              <label htmlFor={`${id}-code`} className="block text-sm">
                {t("6-digit code")}
              </label>
              <input
                id={`${id}-code`}
                name="fresh_code"
                required
                pattern="[0-9]{6}"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                dir="ltr"
                className={inputClass}
              />
            </>
          )}
          {state.recoveryCodes.available && state.recoveryCodes.enabled && (
            <button
              type="button"
              className="text-sm text-primary underline"
              onClick={() => setRecovery(!recovery)}
            >
              {t(recovery ? "Use authenticator code" : "Use a backup code")}
            </button>
          )}
        </>
      ) : (
        <>
          <label htmlFor={`${id}-password`} className="block text-sm">
            {t("Current password")}
          </label>
          <input
            id={`${id}-password`}
            name="current_password"
            type="password"
            required
            maxLength={128}
            autoComplete="current-password"
            dir="ltr"
            className={inputClass}
          />
        </>
      )}
    </fieldset>
  );
}
