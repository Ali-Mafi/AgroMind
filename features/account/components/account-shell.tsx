"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LogOut } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { logoutAction } from "@/features/authentication/services/actions";
const links = [
  ["/account", "Overview"],
  ["/account/profile", "Profile"],
  ["/account/security", "Security"],
  ["/account/subscription", "Subscription"],
  ["/account/usage", "Usage"],
] as const;
export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslation();
  return (
    <div>
      <Button
        variant="outline"
        disabled={busy}
        className="min-h-11 gap-2 rounded-xl"
        onClick={async () => {
          if (busy) return;
          setBusy(true);
          setError("");
          try {
            const result = await logoutAction();
            if (result.error) {
              setError(result.error);
              return;
            }
            if (typeof BroadcastChannel !== "undefined") {
              const channel = new BroadcastChannel("agromind-account");
              channel.postMessage({ type: "signed-out" });
              channel.close();
            }
            window.location.replace("/sign-in");
          } catch {
            setError("Sign out failed. Please try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <LogOut size={17} />
        {t(busy ? "Please wait…" : "Sign out")}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {t(error)}
        </p>
      )}
    </div>
  );
}
export function AccountShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const t = useTranslation();
  const path = usePathname();
  return (
    <main className="mx-auto w-full max-w-6xl space-y-7 px-4 py-6 sm:px-6 sm:py-10">
      <Link
        href="/dashboard"
        className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft size={17} className="rtl:rotate-180" />
        {t("Back to dashboard")}
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            AgroMind
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">
            {t(title)}
          </h1>
        </div>
        <LogoutButton />
      </header>
      <nav
        aria-label={t("Account navigation")}
        className="flex flex-wrap gap-2 border-b pb-4"
      >
        {links.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            aria-current={path === href ? "page" : undefined}
            className={
              "inline-flex min-h-11 items-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors " +
              (path === href
                ? "bg-primary text-primary-foreground"
                : "bg-card hover:bg-primary/10")
            }
          >
            {t(label)}
          </Link>
        ))}
      </nav>
      {children}
    </main>
  );
}
export const accountCardClass =
  "space-y-5 rounded-3xl border bg-card p-5 shadow-sm sm:p-7";
