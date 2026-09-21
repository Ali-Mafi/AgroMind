import type { ReactNode } from "react";
import { BackButton } from "@/features/navigation/components/back-button";

export function PageHeader({
  title,
  description,
  eyebrow,
  action,
  back = false,
}: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  action?: ReactNode;
  back?: boolean;
}) {
  return (
    <header className="space-y-5">
      {back && <BackButton />}
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0 flex-1 basis-56">
          {eyebrow && (
            <p className="mb-2 text-sm font-medium text-primary">{eyebrow}</p>
          )}
          <h1 className="break-words font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            {title}
          </h1>
          {description && (
            <div className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {description}
            </div>
          )}
        </div>
        {action && <div className="max-w-full shrink-0">{action}</div>}
      </div>
    </header>
  );
}
