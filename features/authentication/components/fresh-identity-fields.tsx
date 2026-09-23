"use client";

import { ShieldCheck } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import type { MfaSecurityState } from "../types/mfa";

export function FreshIdentityFields({ state }: { state: MfaSecurityState }) {
  const t = useTranslation();
  const id = useId();
  const [recovery, setRecovery] = useState(false);
  const inputClass =
    "min-h-12 w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25";

  return (
    <div className="space-y-4 rounded-2xl border bg-background/55 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold">{t("Confirm your identity")}</p>
      </div>

      {state.enabled ? (
        <>
          <input
            type="hidden"
            name="proof_method"
            value={recovery ? "recovery" : "totp"}
          />

          {recovery ? (
            <div className="space-y-2">
              <label
                htmlFor={`${id}-recovery`}
                className="block text-sm font-medium"
              >
                {t("Backup code")}
              </label>
              <input
                id={`${id}-recovery`}
                name="fresh_recovery_code"
                required
                maxLength={128}
                autoComplete="one-time-code"
                autoCapitalize="none"
                spellCheck={false}
                dir="ltr"
                className={inputClass}
              />
            </div>
          ) : (
            <>
              {state.factors.length > 1 ? (
                <div className="space-y-2">
                  <label
                    htmlFor={`${id}-factor`}
                    className="block text-sm font-medium"
                  >
                    {t("Authenticator")}
                  </label>
                  <select
                    id={`${id}-factor`}
                    name="proof_factor_id"
                    className={inputClass}
                    defaultValue={state.factors[0]?.id}
                    required
                  >
                    {state.factors.map((factor) => (
                      <option key={factor.id} value={factor.id}>
                        {factor.friendlyName}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <input
                    type="hidden"
                    name="proof_factor_id"
                    value={state.factors[0]?.id ?? ""}
                  />
                  <div className="rounded-xl border bg-card/70 px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                      {t("Current authenticator")}
                    </p>
                    <p className="mt-1 font-medium" dir="auto">
                      {state.factors[0]?.friendlyName ??
                        t("AgroMind Authenticator")}
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label
                  htmlFor={`${id}-code`}
                  className="block text-sm font-medium"
                >
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
                  className={`${inputClass} text-center text-lg tracking-[0.24em]`}
                />
              </div>
            </>
          )}

          {state.recoveryCodes.available && state.recoveryCodes.enabled && (
            <button
              type="button"
              className="inline-flex min-h-10 items-center rounded-lg px-2 text-sm font-medium text-primary transition hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
              onClick={() => setRecovery(!recovery)}
            >
              {t(recovery ? "Use authenticator code" : "Use a backup code")}
            </button>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <label
            htmlFor={`${id}-password`}
            className="block text-sm font-medium"
          >
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
        </div>
      )}
    </div>
  );
}
