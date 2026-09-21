import Link from "next/link";
import { Sprout } from "lucide-react";
import type { ReactNode } from "react";
import { BackButton } from "@/features/navigation/components/back-button";
import "@/components/layout/app-shell.css";
import { T } from "@/features/settings/components/translated-text";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="agromind-app relative isolate flex min-h-svh flex-col px-4 py-6 sm:px-8">
      <BackButton />
      <div className="m-auto w-full max-w-md py-10">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 font-heading text-2xl font-bold text-primary"
        >
          <Sprout className="size-8" />
          AgroMind
        </Link>
        <section className="app-card p-6 sm:p-9">
          <div className="mb-6 h-1 w-12 rounded-full bg-gold" />
          <h1 className="font-heading text-3xl font-bold">
            <T text={title} />
          </h1>
          <p className="mb-7 mt-3 text-sm leading-6 text-muted-foreground">
            <T text={description} />
          </p>
          {children}
        </section>
      </div>
    </main>
  );
}
