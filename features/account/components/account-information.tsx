"use client";
import Link from "next/link";
import { Sprout } from "lucide-react";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { AccountShell } from "./account-shell";

const questions = [
  [
    "How do I get started?",
    "Add a farm or garden, choose its location, then open its overview for weather and irrigation.",
    "/farms",
    "My Farms",
  ],
  [
    "How can I protect my account?",
    "Open Security to add an authenticator and an independent backup. Keep the backup on a separate device.",
    "/account/security",
    "Security",
  ],
  [
    "Where are my language and units?",
    "Preferences lets you choose language, region, measurement units, calendar and appearance.",
    "/settings",
    "Preferences",
  ],
] as const;

export function AccountInformation({ kind }: { kind: "help" | "about" }) {
  const t = useTranslation();
  return (
    <AccountShell title={kind === "help" ? "Help & Support" : "About AgroMind"}>
      {kind === "help" ? (
        <section className="app-card divide-y px-5 sm:px-7">
          {questions.map(([question, answer, href, label]) => (
            <details key={question} className="py-3">
              <summary className="min-h-12 cursor-pointer py-3 text-sm font-semibold">
                {t(question)}
              </summary>
              <p className="max-w-2xl pb-3 text-sm leading-7 text-muted-foreground">
                {t(answer)}
              </p>
              <Link
                href={href}
                className="inline-flex min-h-11 items-center text-sm font-medium text-primary"
              >
                {t(label)}
              </Link>
            </details>
          ))}
        </section>
      ) : (
        <section className="app-card max-w-3xl p-6 sm:p-9">
          <Sprout size={32} className="text-primary" />
          <h2 className="mt-6 text-2xl font-semibold">
            {t("Simple tools for everything you grow")}
          </h2>
          <p className="mt-4 text-base leading-8 text-muted-foreground">
            {t(
              "AgroMind brings your farms, local weather and irrigation plans into one calm, clear space.",
            )}
          </p>
          <Link href="/" className="app-secondary-link mt-7">
            {t("Visit AgroMind")}
          </Link>
        </section>
      )}
    </AccountShell>
  );
}
