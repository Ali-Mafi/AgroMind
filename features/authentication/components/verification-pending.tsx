"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoaderCircle, MailCheck, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import {
  changePendingSignupEmailAction,
  pendingVerificationStatusAction,
  resendVerificationAction,
} from "../services/actions";
import type { AuthFormState } from "../lib/validation";

export function VerificationPending({
  email,
  next = "/dashboard",
}: {
  email: string;
  next?: string;
}) {
  const t = useTranslation();
  const router = useRouter();
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    resendVerificationAction,
    {},
  );
  const [checking, setChecking] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailNotice, setEmailNotice] = useState("");
  const lastCheck = useRef(0);

  const check = useCallback(async () => {
    const now = Date.now();
    if (checking || now - lastCheck.current < 1500) return;
    lastCheck.current = now;
    setChecking(true);
    try {
      const result = await pendingVerificationStatusAction();
      if (result.verified) {
        const params = new URLSearchParams({ status: "email-verified" });
        if (next !== "/dashboard") params.set("next", next);
        router.replace(`/sign-in?${params.toString()}`);
        router.refresh();
      }
    } finally {
      setChecking(false);
    }
  }, [checking, router]);

  const handleEmailSaved = useCallback(
    (message: string) => {
      setEditingEmail(false);
      setEmailNotice(message);
      router.refresh();
    },
    [router],
  );

  useEffect(() => {
    void check();
    const onFocus = () => void check();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void check();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [check]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5 text-center">
        <MailCheck className="mx-auto mb-3 size-9 text-primary" />
        <p className="text-sm text-muted-foreground">
          {t("Check your inbox at")}
        </p>

        {editingEmail ? (
          <PendingEmailEditor
            email={email}
            onCancel={() => setEditingEmail(false)}
            onSaved={handleEmailSaved}
          />
        ) : (
          <div
            dir="ltr"
            className="mt-1 flex items-center justify-center gap-2"
          >
            <p className="break-all font-semibold text-foreground">{email}</p>
            <button
              type="button"
              aria-label={t("Edit email")}
              title={t("Edit email")}
              onClick={() => {
                setEmailNotice("");
                setEditingEmail(true);
              }}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Pencil className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {emailNotice && (
        <p
          role="status"
          className="rounded-xl bg-primary/5 p-4 text-sm leading-6 text-primary"
        >
          {t(emailNotice)}
        </p>
      )}

      <p className="text-sm leading-6 text-muted-foreground">
        {t(
          "Open the verification email, verify your address, then return to the AgroMind app.",
        )}
      </p>

      {checking && (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
          {t("Checking verification status…")}
        </p>
      )}

      {state.error && (
        <p
          role="alert"
          className="rounded-xl bg-destructive/5 p-4 text-sm text-destructive"
        >
          {t(state.error)}
        </p>
      )}

      {state.success && (
        <p role="status" className="rounded-xl bg-primary/5 p-4 text-sm">
          {t(state.success)}
        </p>
      )}

      <form action={action}>
        {state.verificationRequired && (
          <Link
            href="/verify-email?status=resend"
            className="mb-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline"
          >
            {t("Request a new email")}
          </Link>
        )}
        <Button
          type="submit"
          variant="outline"
          disabled={pending}
          className="min-h-12 w-full rounded-xl"
        >
          {pending && (
            <LoaderCircle className="animate-spin motion-reduce:animate-none" />
          )}
          {t(pending ? "Please wait…" : "Resend verification email")}
        </Button>
      </form>
    </div>
  );
}

function PendingEmailEditor({
  email,
  onCancel,
  onSaved,
}: {
  email: string;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const t = useTranslation();
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    changePendingSignupEmailAction,
    {},
  );

  useEffect(() => {
    if (state.success) onSaved(state.success);
  }, [onSaved, state.success]);

  return (
    <form action={action} className="mt-4 space-y-3 text-start">
      <label
        htmlFor="pending-signup-email"
        className="block text-sm font-semibold text-foreground"
      >
        {t("Email address")}
      </label>
      <input
        id="pending-signup-email"
        name="email"
        type="email"
        required
        maxLength={254}
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        dir="ltr"
        defaultValue={email}
        aria-invalid={Boolean(state.fields?.email)}
        className="min-h-12 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      {state.fields?.email && (
        <p role="alert" className="text-sm text-destructive">
          {t(state.fields.email)}
        </p>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {t(state.error)}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          className="min-h-11 flex-1 rounded-xl"
          onClick={onCancel}
        >
          {t("Cancel")}
        </Button>
        <Button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="min-h-11 flex-1 rounded-xl"
        >
          {pending ? (
            <LoaderCircle
              className="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : (
            t("Save and resend")
          )}
        </Button>
      </div>
    </form>
  );
}
