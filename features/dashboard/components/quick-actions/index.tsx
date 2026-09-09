import { T } from "@/features/settings/components/translated-text";
import Link from "next/link";
import {
  ArrowRight,
  Droplets,
  Pencil,
  Sprout,
} from "lucide-react";

interface QuickActionsProps {
  farmId: string;
}

const baseClassName =
  "group flex min-h-24 items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function QuickActions({
  farmId,
}: QuickActionsProps) {
  return (
    <section>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"><T text="Quick Actions" /></p>

        <h2 className="mt-1 text-lg font-bold tracking-tight"><T text="Manage active property" /></h2>

        <p className="mt-1 text-sm text-muted-foreground"><T text="Jump directly to the most common farm management tasks." /></p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/irrigation"
          className={baseClassName}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Droplets className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-semibold"><T text="Manage Irrigation" /></p>

            <p className="mt-1 text-sm leading-5 text-muted-foreground"><T text="Control and schedule irrigation." /></p>
          </div>

          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </Link>

        <Link
          href={`/farms/${farmId}`}
          className={baseClassName}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sprout className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-semibold"><T text="Farm Details" /></p>

            <p className="mt-1 text-sm leading-5 text-muted-foreground"><T text="View property information and details." /></p>
          </div>

          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </Link>

        <Link
          href={`/farms/${farmId}/edit`}
          className={baseClassName}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Pencil className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-semibold"><T text="Edit Property" /></p>

            <p className="mt-1 text-sm leading-5 text-muted-foreground"><T text="Update location, crop, area, and settings." /></p>
          </div>

          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </Link>
      </div>
    </section>
  );
}
