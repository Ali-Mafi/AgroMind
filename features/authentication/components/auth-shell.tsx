import Link from "next/link";
import { ArrowLeft, Sprout } from "lucide-react";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
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
    <main className="relative isolate flex min-h-svh flex-col bg-linear-to-br from-primary/10 via-background to-gold/8 px-4 py-6 sm:px-8">
      <Link
        href="/"
        className={buttonVariants({
          variant: "ghost",
          className: "min-h-11 w-fit gap-2 rounded-xl",
        })}
      >
        <ArrowLeft className="rtl:rotate-180" />
        <T text="Back to home" />
      </Link>
      <div className="m-auto w-full max-w-md py-10">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 font-heading text-2xl font-bold text-primary"
        >
          <Sprout className="size-8" />
          AgroMind
        </Link>
        <section className="rounded-3xl border border-primary/15 bg-card p-6 shadow-sm sm:p-9">
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
