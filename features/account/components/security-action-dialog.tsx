"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useTranslation } from "@/features/settings/hooks/use-translation";

export function SecurityActionDialog({
  open,
  title,
  description,
  busy = false,
  variant = "sheet",
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  description?: string;
  busy?: boolean;
  variant?: "compact" | "sheet";
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const t = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={`security-action-dialog security-action-dialog--${variant}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClose={() => {
        if (open && !busy) onClose();
      }}
    >
      <div className="security-action-dialog__header">
        <div className="min-w-0">
          <h2 id={titleId} className="font-heading text-xl font-bold">
            {t(title)}
          </h2>
          {description && (
            <p
              id={descriptionId}
              className="mt-2 text-sm leading-6 text-muted-foreground"
            >
              {t(description)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="app-control flex size-10 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          aria-label={t("Close")}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="security-action-dialog__body">{children}</div>
      {footer && (
        <div className="security-action-dialog__footer">{footer}</div>
      )}
    </dialog>
  );
}
