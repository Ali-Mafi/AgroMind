"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/features/settings/hooks/use-translation";

type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
  reset: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

export function LoginCaptcha({ attempt }: { attempt: unknown }) {
  const t = useTranslation();
  const element = useRef<HTMLDivElement>(null);
  const widget = useRef<string | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState(false);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  useEffect(() => {
    if (!ready || !sitekey || !element.current || !window.turnstile) return;
    widget.current = window.turnstile.render(element.current, {
      sitekey,
      action: "username-login",
      theme: "auto",
      size: "flexible",
      "response-field": false,
      callback: (value: string) => {
        setToken(value);
        setError(false);
      },
      "expired-callback": () => setToken(""),
      "error-callback": () => {
        setToken("");
        setError(true);
      },
    });
    return () => {
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = undefined;
    };
  }, [ready, sitekey]);
  useEffect(() => {
    if (widget.current) {
      window.turnstile?.reset(widget.current);
    }
  }, [attempt]);
  if (!sitekey) return null;
  return (
    <div className="space-y-2">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={() => setReady(true)}
        onError={() => setError(true)}
      />
      <div ref={element} />
      <input type="hidden" name="captcha_token" value={token} />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {t(
            "Security verification could not load. Please refresh and try again.",
          )}
        </p>
      )}
    </div>
  );
}
