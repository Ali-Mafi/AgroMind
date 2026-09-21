import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Sprout } from "lucide-react";
import { T } from "@/features/settings/components/translated-text";

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
export function SummaryCard({
  title,
  icon,
  children,
  href,
  footer,
}: {
  title: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  href?: string;
  footer?: ReactNode;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
          {icon}
          {title}
        </h3>
        {href && (
          <ArrowUpRight
            className="size-4 text-muted-foreground rtl:-rotate-90"
            aria-hidden="true"
          />
        )}
      </div>
      <div className="mt-5">{children}</div>
      {footer && (
        <div className="mt-5 border-t pt-4 text-sm text-muted-foreground">
          {footer}
        </div>
      )}
    </>
  );
  return href ? (
    <Link
      href={href}
      className="app-card app-card-link block h-full p-5 sm:p-6"
    >
      {content}
    </Link>
  ) : (
    <section className="app-card h-full p-5 sm:p-6">{content}</section>
  );
}
export function StatusCard({
  label,
  title,
  children,
  action,
  icon,
}: {
  label: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[var(--app-radius)] bg-[var(--app-hero)] p-6 text-[var(--app-hero-foreground)] sm:p-9">
      <div className="flex items-start justify-between gap-5">
        <div className="max-w-2xl">
          <p className="text-sm opacity-80">{label}</p>
          <h2 className="mt-4 font-heading text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
            {title}
          </h2>
          {children && (
            <div className="mt-3 text-sm leading-6 opacity-85 sm:text-base">
              {children}
            </div>
          )}
          {action && <div className="mt-6">{action}</div>}
        </div>
        {icon && (
          <div className="hidden rounded-2xl border border-current/15 p-4 text-[var(--app-gold)] sm:block">
            {icon}
          </div>
        )}
      </div>
    </section>
  );
}
export function EmptyState({
  title,
  description,
  action,
  icon = <Sprout size={28} />,
}: {
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <section className="app-card px-6 py-12 text-center sm:py-16">
      <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-primary/8 text-primary">
        {icon}
      </div>
      <h2 className="mt-6 text-xl font-semibold sm:text-2xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-7">{action}</div>}
    </section>
  );
}
export function LoadingSkeleton() {
  return (
    <main className="app-page" aria-busy="true" aria-label="AgroMind">
      <p role="status" className="sr-only">
        <T text="Loading…" />
      </p>
      <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
        <div className="h-10 w-48 rounded-xl bg-muted" />
        <div className="h-52 rounded-3xl bg-muted" />
        <div className="grid gap-5 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-3xl bg-muted" />
          ))}
        </div>
      </div>
    </main>
  );
}
