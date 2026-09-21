"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/settings/hooks/use-translation";
export default function WorkspaceError({ reset }: { reset: () => void }) {
  const t = useTranslation();
  return (
    <main className="mx-auto my-12 w-[calc(100%_-_2rem)] max-w-lg space-y-5 rounded-3xl border bg-card p-7">
      <h1 className="text-2xl font-bold">
        {t("Your cloud data could not be loaded.")}
      </h1>
      <p role="alert" className="text-sm leading-6 text-muted-foreground">
        {t("Please try again. No local data has been removed.")}
      </p>
      <Button onClick={reset} className="min-h-12 rounded-xl">
        {t("Try again")}
      </Button>
      <Link
        href="/sign-in"
        className="ms-4 inline-flex min-h-11 items-center text-sm text-primary"
      >
        {t("Sign in")}
      </Link>
    </main>
  );
}
