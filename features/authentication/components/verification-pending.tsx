"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoaderCircle, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import {
  pendingVerificationStatusAction,
  resendVerificationAction,
} from "../services/actions";
import type { AuthFormState } from "../lib/validation";

export function VerificationPending({ email }: { email: string }) {
  const t = useTranslation();
  const router = useRouter();
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    resendVerificationAction,
    {},
  );
  const [checking, setChecking] = useState(false);
  const lastCheck = useRef(0);

  const check = useCallback(async () => {
    const now = Date.now();
    if (checking || now - lastCheck.current < 1500) return;
    lastCheck.current = now;
    setChecking(true);
    try {
      const result = await pendingVerificationStatusAction();
      if (result.verified) {
        router.replace("/sign-in?status=email-verified");
        router.refresh();
      }
    } finally {
      setChecking(false);
    }
  }, [checking, router]);

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
        <p className="text-sm text-muted-foreground">{t("Check your inbox at")}</p>
        <p dir="ltr" className="mt-1 break-all font-semibold text-foreground">{email}</p>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        {t("Open the verification email, verify your address, then return to the AgroMind app.")}
      </p>
      {checking && (
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
          {t("Checking verification status…")}
        </p>
      )}
      {state.error && (
        <p role="alert" className="rounded-xl bg-destructive/5 p-4 text-sm text-destructive">{t(state.error)}</p>
      )}
      {state.success && (
        <p role="status" className="rounded-xl bg-primary/5 p-4 text-sm">{t(state.success)}</p>
      )}
      <form action={action}>
        {state.verificationRequired && (
          <Link href="/verify-email?status=resend" className="mb-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline">
            {t("Request a new email")}
          </Link>
        )}
        <Button type="submit" variant="outline" disabled={pending} className="min-h-12 w-full rounded-xl">
          {pending && <LoaderCircle className="animate-spin motion-reduce:animate-none" />}
          {t(pending ? "Please wait…" : "Resend verification email")}
        </Button>
      </form>
    </div>
  );
}
