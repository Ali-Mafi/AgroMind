"use client";
import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { LogOut } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { logoutAction } from "@/features/authentication/services/actions";
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
  return <main className="app-page">
    <PageHeader title={t(title)} back={path !== "/account"} eyebrow={path !== "/account" ? t("Account") : undefined} />
    {children}
  </main>;
}
export const accountCardClass =
  "app-card space-y-5 p-5 sm:p-7";
