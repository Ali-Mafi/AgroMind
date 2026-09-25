import Link from "next/link";
import type { ReactNode } from "react";
import { Sprout } from "lucide-react";
import { NavigationArrow } from "@/components/ui/navigation-arrow";
import { T } from "@/features/settings/components/translated-text";
import { cn } from "@/lib/utils";

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
  className,
  backdrop,
}: {
  title: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  href?: string;
  footer?: ReactNode;
  className?: string;
  backdrop?: ReactNode;
}) {
  const content = (
    <>
      {backdrop}
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
          {icon && <span className="app-icon-container" aria-hidden="true">{icon}</span>}
          {title}
        </h3>

      </div>
      <div data-slot="summary-content" className="mt-5">{children}</div>
      {footer && (
        <div data-slot="summary-footer" className="mt-5 flex items-center justify-between gap-3 border-t pt-4 text-sm font-medium text-primary">
          {footer}{href && <NavigationArrow size={16} />}
        </div>
      )}
    </>
  );
  return href ? (
    <Link
      href={href}
      className={cn("app-card app-card-link block h-full p-5 sm:p-6", className)}
    >
      {content}
    </Link>
  ) : (
    <section className={cn("app-card h-full p-5 sm:p-6", className)}>{content}</section>
  );
}
export function StatusCard({
  label,
  title,
  children,
  action,
  icon,
  className,
  backdrop,
}: {
  label: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
  backdrop?: ReactNode;
}) {
  return (
    <section className={cn("relative overflow-hidden rounded-[var(--app-radius)] bg-[var(--app-hero)] p-6 text-[var(--app-hero-foreground)] sm:p-9", className)}>
      {backdrop}
      <div data-slot="status-content" className="flex items-start justify-between gap-5">
        <div className="max-w-2xl">
          <p data-slot="status-label" className="text-sm opacity-80">{label}</p>
          <h2 className="mt-4 font-heading text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
            {title}
          </h2>
          {children && (
            <div data-slot="status-description" className="mt-3 text-sm leading-6 opacity-85 sm:text-base">
              {children}
            </div>
          )}
          {action && <div className="mt-6">{action}</div>}
        </div>
        {icon && (
          <div data-slot="status-icon" className="hidden rounded-2xl border border-current/15 p-4 text-[var(--app-gold)] sm:block">
            {icon && <span className="app-icon-container" aria-hidden="true">{icon}</span>}
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
  className,
}: {
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("app-card app-state-enter px-6 py-12 text-center sm:py-16", className)}>
      <div data-slot="empty-icon" className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-primary/8 text-primary">
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
