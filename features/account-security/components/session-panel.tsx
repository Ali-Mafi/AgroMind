"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Monitor, Smartphone, Tablet, ShieldCheck, RefreshCw, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { useSettings } from "@/features/settings/context/settings-context";
import { accountCardClass, LogoutButton } from "@/features/account/components/account-shell";
import type { SecuritySnapshot } from "../types/security";

const eventLabels: Record<string, string> = {
  login: "New successful login", logout: "Signed out", mfa_enrolled: "Authenticator enrolled",
  mfa_removed: "Authenticator removed", password_changed: "Password changed", username_changed: "Username changed",
  revocation_requested: "Remote sign-out authorized", sessions_revoked: "Remote sessions signed out", revocation_pending: "Provider sign-out pending",
};
export function SessionPanel({ snapshot, error, mfaEnabled, onRevoke, onEnroll }: {
  snapshot: SecuritySnapshot | null;
  error?: boolean;
  mfaEnabled: boolean;
  onRevoke: (scope: "others" | "global") => void;
  onEnroll: () => void;
}) {
  const t = useTranslation();
  const settings = useSettings();
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const stamp = (value: string) => {
    const date = new Date(value);
    return `${settings.format.date(date, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" })}`;
  };
  const others = snapshot?.sessions.filter(s => !s.current && s.state === "active").length ?? 0;
  const ordered = [...(snapshot?.sessions ?? [])].sort((a,b) => Number(b.current)-Number(a.current));
  return <>
    <section className={accountCardClass} aria-busy={refreshing}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold"><ShieldCheck className="text-primary" aria-hidden="true" />{t("Active devices and sessions")}</h2>
        <Button variant="ghost" disabled={refreshing} onClick={() => startRefresh(() => router.refresh())}>
          {refreshing ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}{t("Refresh")}
        </Button>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("Sessions are read from Supabase Auth. Device descriptions come from the browser; locations are approximate. Historical details may be unavailable.")}</p>
      {error ? <div role="alert" className="mt-4 rounded-xl border border-destructive/20 p-4 text-sm text-destructive">{t("Sessions could not load. Refresh to try again.")}</div> : !ordered.length ? <p role="status" className="mt-4 text-sm">{t("No sessions are available.")}</p> :
        <div className="mt-5 grid min-w-0 gap-3 lg:grid-cols-2">{ordered.map(session => {
          const m = session.metadata;
          const Icon = m.device === "Mobile" ? Smartphone : m.device === "Tablet" ? Tablet : Monitor;
          const location = [m.city,m.region,m.country].filter(Boolean).join(", ");
          const provider = session.provider === "password" ? "Password" : session.provider === "google" ? "Google" : session.provider === "oauth" ? "OAuth" : session.provider === "recovery" ? "Account recovery" : "Unavailable";
          return <article key={session.id} className={`min-w-0 rounded-2xl border p-4 ${session.current ? "border-primary/40 bg-primary/5 ring-1 ring-primary/10" : "bg-background/50"}`}>
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-primary/10 p-2 text-primary"><Icon aria-hidden="true" /></span>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold">{t(m.device ?? "Unknown device")}</h3>
                <p className="break-words text-sm text-muted-foreground" dir="auto">{t(m.os ?? "Unknown operating system")} · {t(m.browser ?? "Unknown browser")}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              {session.current && <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">{t("Current session")}</span>}
              <span className="rounded-full border px-2 py-1">{t(session.state === "active" ? "Active" : session.state === "expired" ? "Expired" : "Access blocked; provider sign-out pending")}</span>
            </div>
            <dl className="mt-4 space-y-2 text-sm [overflow-wrap:anywhere]">
              {[["Approximate location", location || t("Unknown location")], ["IP address", m.ip ?? t("Unavailable")], ["Authentication method", t(provider)], ["Signed in since", stamp(session.createdAt)], ["Last token refresh", session.lastRefreshAt ? stamp(session.lastRefreshAt) : t("Unavailable")]].map(([label,value]) => <div key={label}><dt className="text-xs text-muted-foreground">{t(label)}</dt><dd dir="auto">{value}</dd></div>)}
            </dl>
            {session.current && <div className="mt-4"><LogoutButton /></div>}
          </article>;
        })}</div>}
      <p className="mt-4 text-xs leading-6 text-muted-foreground">{t("Last token refresh is provider activity, not the last time a person used the device. Individual remote session sign-out is unavailable; use sign out all other devices.")}</p>
      <p className="mt-2 text-xs leading-6 text-muted-foreground">{t("Revoked sessions cannot make new protected AgroMind data requests. Provider APIs and requests already in progress can retain access until their own checks or token expiry.")}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {mfaEnabled ? <>
          <Button variant="outline" disabled={!!error || refreshing} onClick={() => onRevoke("others")}>{t("Sign out all other devices")} ({settings.format.number(others)})</Button>
          <Button variant="outline" disabled={!!error || refreshing} onClick={() => onRevoke("global")}>{t("Sign out all sessions")}</Button>
        </> : <Button variant="outline" onClick={onEnroll}>{t("Set up authenticator")}</Button>}
      </div>
      {!mfaEnabled && <p className="mt-3 text-sm text-muted-foreground">{t("Set up an authenticator before signing out remote sessions.")}</p>}
    </section>
    <section className={accountCardClass}>
      <h2 className="text-xl font-bold">{t("Recent security activity")}</h2>
      <p className="mt-2 text-xs leading-6 text-muted-foreground">{t("Up to 50 events from the last 90 days. IP and approximate location details are retained for 30 days. Activity before this feature was enabled is unavailable.")}</p>
      {error ? <p role="alert" className="mt-4 text-sm text-destructive">{t("Security activity could not load.")}</p> : !snapshot?.events.length ? <p className="mt-4 text-sm text-muted-foreground">{t("No recent security activity.")}</p> : <ul className="mt-4 divide-y">{snapshot.events.map(event => <li key={event.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
        <span>{t(eventLabels[event.kind] ?? "Security event")}{typeof event.details.count === "number" ? ` (${settings.format.number(event.details.count)})` : ""}</span>
        <time dateTime={event.created_at} className="text-xs text-muted-foreground">{stamp(event.created_at)}</time>
      </li>)}</ul>}
    </section>
  </>;
}
