"use client";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { useSettings } from "@/features/settings/context/settings-context";
import { LEGAL_SUPPORT_EMAIL, LEGAL_UI, LINKS, NOTICES, REVIEWED_ON, type LegalKind } from "../content";

export function LegalModalDialog({ kind, onSelect, onClose }: {
  kind: LegalKind; onSelect: (kind: LegalKind) => void; onClose: () => void;
}) {
  const { language } = useSettings();
  const lang = language === "fa" ? "fa" : "en";
  const ui = LEGAL_UI[lang];
  const notice = NOTICES[kind][lang];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const summaryId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [kind]);

  return <dialog
    ref={dialogRef}
    lang={lang}
    dir={lang === "fa" ? "rtl" : "ltr"}
    aria-labelledby={headingId}
    aria-describedby={summaryId}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClose={onClose}
    className="fixed inset-0 m-auto w-[min(94vw,780px)] max-h-[min(90dvh,920px)] overflow-hidden rounded-3xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/65"
  >
    <div className="flex max-h-[min(90dvh,920px)] min-h-0 flex-col">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border/70 bg-background px-5 py-4 sm:px-7">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-primary">AgroMind</p>
          <h2 id={headingId} className="mt-1 font-heading text-xl font-bold leading-8 sm:text-2xl">{notice.title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{ui.reviewed}: <bdi>{REVIEWED_ON}</bdi></p>
        </div>
        <button type="button" aria-label={ui.close} onClick={onClose}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <X size={20} aria-hidden="true" />
        </button>
      </header>
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-7 overflow-y-auto overscroll-contain px-5 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-7">
        <p id={summaryId} className="text-sm leading-7 text-muted-foreground sm:text-base">{notice.description}</p>
        {notice.items.map(([title, body]) =>
          <section key={title} className="space-y-2">
            <h3 className="text-base font-semibold sm:text-lg">{title}</h3>
            <p className="text-sm leading-7 text-muted-foreground sm:text-base">{body}</p>
          </section>
        )}
        <p className="text-sm text-muted-foreground">
          {ui.support}: <a href={`mailto:${LEGAL_SUPPORT_EMAIL}`} className="text-primary hover:underline">{LEGAL_SUPPORT_EMAIL}</a>
        </p>
      </div>
      <nav aria-label={ui.navigation} className="flex shrink-0 flex-wrap gap-x-4 gap-y-1 border-t border-border/70 bg-background px-5 py-3 sm:px-7">
        {LINKS.map(([id, , en, fa]) =>
          <button key={id} type="button" aria-pressed={id === kind} onClick={() => onSelect(id)}
            className={`inline-flex min-h-10 items-center text-sm hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${id === kind ? "font-bold text-primary" : "text-muted-foreground"}`}>
            {lang === "fa" ? fa : en}
          </button>
        )}
      </nav>
    </div>
  </dialog>;
}
