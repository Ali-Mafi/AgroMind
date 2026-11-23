"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/settings/hooks/use-translation";

export function MfaCancelForm({
  id,
  attempt,
  recovery,
}: {
  id: string;
  attempt: string;
  recovery: boolean;
}) {
  const t = useTranslation();
  const inFlight = useRef(false);
  const [status, setStatus] = useState<"idle" | "pending" | "failed">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const form = event.currentTarget;
    inFlight.current = true;
    setStatus("pending");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      // The current document can still carry sign-in's no-referrer policy
      // after a Next.js client navigation to MFA.
      const response = await fetch(form.action, {
        method: "POST",
        body: new URLSearchParams({ attempt }),
        headers: { Accept: "application/json" },
        mode: "same-origin",
        referrerPolicy: "same-origin",
        redirect: "error",
        signal: controller.signal,
      });
      if (response.status === 204) {
        if (form.isConnected) window.location.replace("/sign-in");
        return;
      }
    } catch {
      // Leave the challenge available for retry if the request fails.
    } finally {
      clearTimeout(timeout);
    }

    inFlight.current = false;
    setStatus("failed");
  }

  return (
    <form
      id={id}
      method="post"
      action="/mfa/cancel"
      onSubmit={submit}
      className="mt-4"
    >
      <input type="hidden" name="attempt" value={attempt} />
      <Button
        type="submit"
        variant="outline"
        disabled={status === "pending"}
        className="min-h-11 w-full whitespace-normal rounded-xl"
      >
        {t(
          recovery
            ? "Cancel password reset"
            : "Cancel sign-in or use another account",
        )}
      </Button>
      {status === "pending" && (
        <p role="status" className="sr-only">
          {t("Please wait…")}
        </p>
      )}
      {status === "failed" && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {t("Could not cancel. Please try again.")}
        </p>
      )}
    </form>
  );
}
