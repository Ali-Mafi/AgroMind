"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { AtSign, LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFarm } from "@/features/farms/context/farm-context";
import { FreshIdentityFields } from "@/features/authentication/components/fresh-identity-fields";
import type { MfaSecurityState } from "@/features/authentication/types/mfa";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { accountInputClass } from "@/features/authentication/components/auth-form";
import {
  updateUsernameAction,
  type UsernameActionState,
} from "../services/username-actions";
import { accountCardClass } from "./account-shell";

const initialState: UsernameActionState = {};

export function UsernameForm({
  currentUsername,
  securityState,
}: {
  currentUsername: string | null;
  securityState: MfaSecurityState;
}) {
  const t = useTranslation();
  const { reload } = useFarm();
  const [username, setUsername] = useState(currentUsername ?? "");
  const [state, action, pending] = useActionState(
    updateUsernameAction,
    initialState,
  );

  useEffect(() => {
    setUsername(currentUsername ?? "");
  }, [currentUsername]);

  useEffect(() => {
    if (state.success) void reload();
  }, [reload, state.success]);

  const canChange =
    securityState.enabled && securityState.factors.length > 0;

  return (
    <section className={accountCardClass}>
      <div className="flex items-start gap-4">
        <span className="app-icon-container shrink-0">
          <AtSign size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{t("Username")}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {currentUsername ? (
              <>
                {t("Current username")}:{" "}
                <bdi className="font-medium text-foreground">
                  @{currentUsername}
                </bdi>
              </>
            ) : (
              t("Username not set")
            )}
          </p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {t(
              "Your username is separate from your full name and can be used to sign in.",
            )}
          </p>
        </div>
      </div>

      {!canChange ? (
        <div className="mt-5 rounded-2xl border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">
                {t("Two-step verification required")}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t(
                  "Enable two-step verification before setting or changing your username.",
                )}
              </p>
              <Link
                href="/account/security"
                className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline"
              >
                {t("Open Security")}
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <form action={action} className="mt-5 space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="profile-username"
              className="block text-sm font-semibold"
            >
              {t(currentUsername ? "New username" : "Username")}
            </label>
            <input
              id="profile-username"
              name="username"
              required
              minLength={3}
              maxLength={30}
              pattern="[a-z0-9_]{3,30}"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              dir="ltr"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value.toLowerCase())
              }
              aria-invalid={Boolean(state.fields?.username)}
              aria-describedby={
                state.fields?.username
                  ? "profile-username-error profile-username-help"
                  : "profile-username-help"
              }
              className={accountInputClass}
            />
            <p
              id="profile-username-help"
              className="text-xs leading-5 text-muted-foreground"
            >
              {t("Use 3–30 lowercase letters, numbers, or underscores.")}
            </p>
            {state.fields?.username && (
              <p
                id="profile-username-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {t(state.fields.username)}
              </p>
            )}
          </div>

          <FreshIdentityFields state={securityState} />

          {state.error && (
            <p
              role="alert"
              className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm leading-6 text-destructive"
            >
              {t(state.error)}
            </p>
          )}
          {state.success && (
            <p
              role="status"
              className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm font-medium text-primary"
            >
              {t(state.success)}
            </p>
          )}

          <Button
            type="submit"
            disabled={
              pending ||
              username.trim().toLowerCase() === (currentUsername ?? "")
            }
            className="min-h-12 rounded-xl px-6"
          >
            {pending && (
              <LoaderCircle className="animate-spin motion-reduce:animate-none" />
            )}
            {t(
              pending
                ? "Please wait…"
                : currentUsername
                  ? "Change username"
                  : "Set username",
            )}
          </Button>
        </form>
      )}
    </section>
  );
}
