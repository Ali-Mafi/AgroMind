"use client";

import { Check, LoaderCircle, Mail, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import {
  acceptFarmInvitationAction,
  declineFarmInvitationAction,
} from "../services/actions";

export function InvitationAccept({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const t = useTranslation();
  const [busy, setBusy] = useState<"accept" | "decline" | "">("");
  const [error, setError] = useState("");
  const [declined, setDeclined] = useState(false);

  async function accept() {
    if (busy) return;
    setBusy("accept");
    setError("");
    try {
      const result = await acceptFarmInvitationAction(token);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.replace(result.data.destination);
    } catch {
      setError("This invitation could not be accepted. Please try again.");
    } finally {
      setBusy("");
    }
  }

  async function decline() {
    if (busy) return;
    setBusy("decline");
    setError("");
    try {
      const result = await declineFarmInvitationAction(token);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDeclined(true);
    } catch {
      setError("This invitation could not be declined. Please try again.");
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {declined ? <X size={23} /> : <Mail size={23} />}
        </div>

        <h1 className="mt-6 text-2xl font-bold">
          {t(declined ? "Invitation declined" : "Farm invitation")}
        </h1>

        {declined ? (
          <>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t("No farm access was added to your account.")}
            </p>
            <Button
              type="button"
              className="mt-6 min-h-12 w-full rounded-xl"
              onClick={() => window.location.replace("/dashboard")}
            >
              {t("Go to dashboard")}
            </Button>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t(
                "Review this invitation while signed in with the email address that received it.",
              )}
            </p>

            <div className="mt-5 rounded-2xl border bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("Signed in as")}
              </p>
              <p dir="ltr" className="mt-2 break-all font-semibold">
                {email}
              </p>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-primary/6 p-4">
              <ShieldCheck className="mt-0.5 shrink-0 text-primary" size={18} />
              <p className="text-sm leading-6 text-muted-foreground">
                {t(
                  "AgroMind verifies the invited email, invitation expiry and team capacity before access is added.",
                )}
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm leading-6 text-destructive"
              >
                {t(error)}
              </p>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                disabled={Boolean(busy)}
                onClick={() => void decline()}
                className="min-h-12 rounded-xl"
              >
                {busy === "decline" ? (
                  <LoaderCircle className="animate-spin motion-reduce:animate-none" />
                ) : (
                  <X size={17} />
                )}
                {t("Decline")}
              </Button>
              <Button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void accept()}
                className="min-h-12 rounded-xl"
              >
                {busy === "accept" ? (
                  <LoaderCircle className="animate-spin motion-reduce:animate-none" />
                ) : (
                  <Check size={17} />
                )}
                {t("Accept invitation")}
              </Button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
