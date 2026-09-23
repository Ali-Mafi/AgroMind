"use client";

import Image from "next/image";
import {
  Check,
  Copy,
  KeyRound,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { useSettings } from "@/features/settings/context/settings-context";
import { FreshIdentityFields } from "@/features/authentication/components/fresh-identity-fields";
import {
  beginTotpEnrollmentAction,
  cancelTotpEnrollmentAction,
  disableTotpAction,
  generateRecoveryCodesAction,
  regenerateRecoveryCodesAction,
  signOutSessionsAction,
  verifyTotpEnrollmentAction,
} from "@/features/authentication/services/mfa-actions";
import type {
  MfaActionState,
  MfaSecurityState,
} from "@/features/authentication/types/mfa";
import { AccountShell, accountCardClass } from "./account-shell";
import { SecurityActionDialog } from "./security-action-dialog";

type Setup = { factorId: string; qrCode: string; secret: string };
type Operation =
  | "setup"
  | "remove"
  | "disable"
  | "generate"
  | "regenerate"
  | "others"
  | "global";

const labels: Record<Operation, string> = {
  setup: "Set up authenticator",
  remove: "Remove authenticator",
  disable: "Disable two-step verification?",
  generate: "Generate backup codes",
  regenerate: "Regenerate backup codes",
  others: "Sign out other sessions",
  global: "Sign out all sessions",
};

const inputClass =
  "min-h-12 w-full rounded-xl border bg-background px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-primary/25";

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("COPY_FAILED");
}

export function SecurityCenter({
  initialState,
}: {
  initialState: MfaSecurityState;
}) {
  const t = useTranslation();
  const settings = useSettings();
  const router = useRouter();
  const [setup, setSetup] = useState<Setup | null>(null);
  const [operation, setOperation] = useState<Operation | null>(null);
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [message, setMessage] = useState<MfaActionState>({});
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState<"secret" | "backup" | null>(null);

  async function run(task: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setMessage({});
    try {
      await task();
    } catch {
      setMessage({
        error:
          "Account services are temporarily unavailable. Please try again.",
      });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function choose(next: Operation, factorId = "") {
    setSetup(null);
    setBackupCodes([]);
    setMessage({});
    setTarget(factorId);
    setOperation(next);
  }

  async function copy(value: string, type: "secret" | "backup") {
    try {
      await copyText(value);
      setCopied(type);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setMessage({ error: "Copy failed. Please select and copy it manually." });
    }
  }

  async function submit(form: FormData) {
    await run(async () => {
      if (operation === "setup") {
        const result = await beginTotpEnrollmentAction(form);
        if ("error" in result) {
          setMessage(result);
          return;
        }
        setSetup(result);
        setMessage({});
        return;
      }

      if (operation === "generate" || operation === "regenerate") {
        const result =
          operation === "generate"
            ? await generateRecoveryCodesAction(form)
            : await regenerateRecoveryCodesAction(form);
        if ("error" in result) {
          setMessage(result);
          return;
        }
        setBackupCodes(result.codes);
        setMessage({});
        router.refresh();
        return;
      }

      let result: MfaActionState;
      if (operation === "others" || operation === "global") {
        form.set("scope", operation);
        result = await signOutSessionsAction({}, form);
      } else {
        form.set("factor_id", target || initialState.factors[0]?.id || "");
        form.set("remove_only", operation === "remove" ? "true" : "false");
        result = await disableTotpAction({}, form);
      }

      setMessage(result);
      if (result.success) {
        setOperation(null);
        router.refresh();
      }
    });
  }

  async function cancelSetup(factorId: string) {
    await run(async () => {
      const result = await cancelTotpEnrollmentAction(factorId);
      if (result.error) {
        setMessage(result);
        return;
      }
      setSetup(null);
      setOperation(null);
      setMessage({});
      router.refresh();
    });
  }

  function closeDialog() {
    if (busy) return;
    if (setup) {
      void cancelSetup(setup.factorId);
      return;
    }
    setOperation(null);
    setBackupCodes([]);
    setMessage({});
  }

  async function verifySetup(form: FormData) {
    await run(async () => {
      const result = await verifyTotpEnrollmentAction({}, form);
      setMessage(result);
      if (result.success) {
        setSetup(null);
        setOperation(null);
        router.refresh();
      }
    });
  }

  const formattedBackupCodes = backupCodes.map(
    (code) => code.match(/.{1,4}/g)?.join("-") ?? code,
  );

  const dialogDescription =
    operation === "setup"
      ? setup
        ? "Open Google Authenticator, tap Add account, then scan this QR code."
        : "A fresh confirmation is required for this action."
      : operation === "disable" ||
          (operation === "remove" && initialState.factors.length === 1)
        ? "Your account will return to password-only sign in until you enable an authenticator again."
        : operation === "regenerate"
          ? "Generating new backup codes will invalidate every old backup code."
          : operation === "generate"
            ? "Store these codes somewhere safe. They are shown only once."
            : operation === "others" || operation === "global"
              ? "AgroMind blocks revoked sessions from cloud data immediately. Previously issued tokens may remain valid at the authentication provider until they expire."
              : undefined;

  return (
    <AccountShell title="Security">
      <section className={accountCardClass}>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            {initialState.enabled ? <ShieldCheck /> : <ShieldOff />}
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold">
              {t("Authenticator app")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t(
                "Use Google Authenticator, 1Password, Authy, or another TOTP app for an extra sign-in step.",
              )}
            </p>
            <p className="mt-3 font-semibold text-primary">
              {t(
                initialState.enabled
                  ? "Two-step verification is on"
                  : "Two-step verification is off",
              )}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {initialState.factors.map((factor) => (
            <div
              key={factor.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-background/70 p-4"
            >
              <div>
                <p className="font-semibold">{factor.friendlyName}</p>
                <p className="text-sm text-muted-foreground">
                  {t("Verified authenticator factor")}
                </p>
              </div>
              <Button
                variant="outline"
                disabled={busy || !!setup}
                onClick={() => choose("remove", factor.id)}
              >
                {t("Remove authenticator")}
              </Button>
            </div>
          ))}

          {!setup &&
            (initialState.pendingFactors ?? []).map((factor) => (
              <div
                key={factor.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
              >
                <p className="text-sm">
                  {t("Incomplete authenticator setup")}: {factor.friendlyName}
                </p>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => cancelSetup(factor.id)}
                >
                  {t("Discard incomplete setup")}
                </Button>
              </div>
            ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {initialState.factors.length < 2 && (
            <Button disabled={busy} onClick={() => choose("setup")}>
              {t(
                initialState.enabled
                  ? "Add backup authenticator"
                  : "Set up authenticator",
              )}
            </Button>
          )}
          {initialState.enabled && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => choose("disable")}
            >
              {t("Disable authenticator")}
            </Button>
          )}
        </div>

        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {t(
            "Keep a second authenticator on a separate device. If you lose one, sign in with the other and remove the lost authenticator.",
          )}
        </p>

        {initialState.enabled &&
          initialState.factors.length < 2 &&
          !initialState.recoveryCodes.enabled && (
            <p className="mt-3 text-sm text-[var(--app-gold)]">
              {t(
                "Add a backup before you lose access. Password reset does not bypass two-step verification.",
              )}
            </p>
          )}
      </section>

      {initialState.enabled && (
        <section className={accountCardClass}>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <KeyRound />
            {t("Backup codes")}
          </h2>

          {!initialState.recoveryCodes.available ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {t("Backup codes are not available for this project yet.")}
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {initialState.recoveryCodes.enabled && (
                <p className="text-sm">
                  {settings.format.number(initialState.recoveryCodes.remaining)}{" "}
                  / {settings.format.number(initialState.recoveryCodes.total)}{" "}
                  {t("backup codes remaining")}
                </p>
              )}
              <Button
                variant="outline"
                disabled={busy || !!setup}
                onClick={() =>
                  choose(
                    initialState.recoveryCodes.enabled
                      ? "regenerate"
                      : "generate",
                  )
                }
              >
                {t(
                  initialState.recoveryCodes.enabled
                    ? "Regenerate backup codes"
                    : "Generate backup codes",
                )}
              </Button>
            </div>
          )}
        </section>
      )}

      <section className={accountCardClass}>
        <h2 className="text-xl font-bold">{t("Sessions")}</h2>
        {initialState.currentSession && (
          <div className="mt-3 rounded-xl border p-3">
            <p className="font-semibold">{t("Current session")}</p>
            <p className="text-sm text-muted-foreground">
              {t("Signed in since")}:{" "}
              <time dateTime={initialState.currentSession.createdAt}>
                {settings.format.date(
                  new Date(initialState.currentSession.createdAt),
                )}
              </time>
            </p>
          </div>
        )}
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {t(
            "AgroMind blocks revoked sessions from cloud data immediately. Previously issued tokens may remain valid at the authentication provider until they expire.",
          )}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant="outline"
            disabled={busy || !!setup}
            onClick={() => choose("others")}
          >
            {t("Sign out other sessions")}
          </Button>
          <Button
            variant="outline"
            disabled={busy || !!setup}
            onClick={() => choose("global")}
          >
            {t("Sign out all sessions")}
          </Button>
        </div>
      </section>

      {!operation && message.error && (
        <p role="alert" className="text-sm text-destructive">
          {t(message.error)}
        </p>
      )}
      {!operation && message.success && (
        <p role="status" className="text-sm font-medium text-primary">
          {t(message.success)}
        </p>
      )}

      <SecurityActionDialog
        open={operation !== null}
        title={operation ? labels[operation] : "Security"}
        description={dialogDescription}
        busy={busy}
        onClose={closeDialog}
      >
        {operation === "setup" && !setup && (
          <form action={submit} className="space-y-5">
            <FreshIdentityFields state={initialState} />
            {message.error && (
              <p
                role="alert"
                className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm leading-6 text-destructive"
              >
                {t(message.error)}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={closeDialog}
              >
                {t("Cancel")}
              </Button>
              <Button disabled={busy}>
                {t(busy ? "Please wait…" : "Confirm")}
              </Button>
            </div>
          </form>
        )}

        {operation === "setup" && setup && (
          <div className="space-y-5">
            <div className="rounded-2xl border bg-background/70 p-4">
              <h3 className="font-bold">{t("Scan the QR code")}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t(
                  "Open Google Authenticator, tap Add account, then scan this QR code.",
                )}
              </p>
              <Image
                src={setup.qrCode}
                alt={t("Authenticator QR code")}
                width={220}
                height={220}
                unoptimized
                className="mx-auto mt-4 rounded-xl bg-[var(--app-code-surface)] p-3"
              />
            </div>

            <div className="rounded-2xl border bg-background/70 p-4">
              <p className="text-sm font-semibold">{t("Cannot scan it?")}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(
                  "Enter this setup key manually in your authenticator app.",
                )}
              </p>
              <code
                dir="ltr"
                className="mt-3 block break-all rounded-xl border bg-card p-3 text-center"
              >
                {setup.secret}
              </code>
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                onClick={() => copy(setup.secret, "secret")}
              >
                {copied === "secret" ? <Check /> : <Copy />}
                {t(copied === "secret" ? "Copied" : "Copy")}
              </Button>
            </div>

            <form action={verifySetup} className="space-y-4">
              <input type="hidden" name="factor_id" value={setup.factorId} />
              <div className="space-y-2">
                <label
                  htmlFor="enrollment-code"
                  className="block text-sm font-semibold"
                >
                  {t("6-digit code")}
                </label>
                <input
                  id="enrollment-code"
                  name="code"
                  required
                  pattern="[0-9]{6}"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  dir="ltr"
                  className={inputClass}
                />
              </div>

              {message.error && (
                <p
                  role="alert"
                  className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm leading-6 text-destructive"
                >
                  {t(message.error)}
                </p>
              )}

              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => cancelSetup(setup.factorId)}
                >
                  {t("Cancel")}
                </Button>
                <Button disabled={busy}>
                  {t(busy ? "Please wait…" : "Verify and enable")}
                </Button>
              </div>
            </form>
          </div>
        )}

        {(operation === "generate" || operation === "regenerate") &&
        backupCodes.length ? (
          <div className="space-y-5">
            <p className="text-sm leading-6 text-[var(--app-gold)]">
              {t(
                "Store these codes somewhere safe. They are shown only once.",
              )}
            </p>
            <div className="grid gap-2 sm:grid-cols-2" dir="ltr">
              {formattedBackupCodes.map((code) => (
                <code
                  key={code}
                  className="select-all rounded-xl border bg-background p-3 text-center"
                >
                  {code}
                </code>
              ))}
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <Button
                variant="outline"
                onClick={() =>
                  copy(formattedBackupCodes.join("\n"), "backup")
                }
              >
                {copied === "backup" ? <Check /> : <Copy />}
                {t(copied === "backup" ? "Copied" : "Copy all backup codes")}
              </Button>
              <Button
                onClick={() => {
                  setBackupCodes([]);
                  setOperation(null);
                  setMessage({
                    success: "Backup codes are ready. Save them somewhere safe now.",
                  });
                  router.refresh();
                }}
              >
                {t("I saved my backup codes")}
              </Button>
            </div>
          </div>
        ) : (
          operation &&
          operation !== "setup" && (
            <form
              key={`${operation}:${target}`}
              action={submit}
              className="space-y-5"
            >
              <FreshIdentityFields state={initialState} />

              {message.error && (
                <p
                  role="alert"
                  className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm leading-6 text-destructive"
                >
                  {t(message.error)}
                </p>
              )}

              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={closeDialog}
                >
                  {t("Cancel")}
                </Button>
                <Button disabled={busy}>
                  {t(busy ? "Please wait…" : "Confirm")}
                </Button>
              </div>
            </form>
          )
        )}
      </SecurityActionDialog>
    </AccountShell>
  );
}
