"use client";
import { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PreferenceSelect } from "@/features/settings/components/preference-select";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { SUPPORT_CATEGORIES } from "../constants/help";
import { validateSupportDraft, type SupportDraft } from "../lib/support-draft";

/** Draft only until a real authenticated ticket service exists. No network/storage writes. */
export function SupportTicketForm() {
  const t = useTranslation();
  const [draft, setDraft] = useState<SupportDraft>({
    subject: "",
    category: "",
    description: "",
  });
  const [touched, setTouched] = useState<
    Partial<Record<keyof SupportDraft, boolean>>
  >({});
  const errors = validateSupportDraft(draft);
  const update = (key: keyof SupportDraft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  return (
    <form
      noValidate
      onSubmit={(event) => event.preventDefault()}
      className="space-y-5"
    >
      <p
        id="ticket-availability"
        className="flex items-start gap-3 rounded-xl bg-muted p-4 text-sm leading-6 text-muted-foreground"
      >
        <Info className="mt-1 size-4 shrink-0" aria-hidden="true" />
        {t(
          "Ticket submission is not available yet. You can prepare a draft here, but it will not be sent or saved when you leave.",
        )}
      </p>
      <div className="space-y-2">
        <label htmlFor="ticket-subject" className="block text-sm font-semibold">
          {t("Subject")}
        </label>
        <input
          id="ticket-subject"
          value={draft.subject}
          maxLength={120}
          required
          autoComplete="off"
          onChange={(event) => update("subject", event.target.value)}
          onBlur={() =>
            setTouched((current) => ({ ...current, subject: true }))
          }
          aria-invalid={!!(touched.subject && errors.subject)}
          aria-describedby={
            touched.subject && errors.subject
              ? "ticket-subject-error"
              : undefined
          }
          className="min-h-12 w-full rounded-xl border bg-background px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        {touched.subject && errors.subject && (
          <p
            id="ticket-subject-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {t(errors.subject)}
          </p>
        )}
      </div>
      <PreferenceSelect
        label={t("Category")}
        placeholder={t("Choose a support category")}
        value={draft.category}
        options={SUPPORT_CATEGORIES.map((value) => ({
          value,
          label: t(value),
        }))}
        onChange={(value) => update("category", value)}
      />
      <div className="space-y-2">
        <label
          htmlFor="ticket-description"
          className="block text-sm font-semibold"
        >
          {t("Description")}
        </label>
        <textarea
          id="ticket-description"
          value={draft.description}
          maxLength={4000}
          required
          rows={5}
          onChange={(event) => update("description", event.target.value)}
          onBlur={() =>
            setTouched((current) => ({ ...current, description: true }))
          }
          aria-invalid={!!(touched.description && errors.description)}
          aria-describedby={`ticket-description-help${touched.description && errors.description ? " ticket-description-error" : ""}`}
          className="min-h-32 w-full resize-y rounded-xl border bg-background p-4 text-base leading-7 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <p
          id="ticket-description-help"
          className="text-xs leading-5 text-muted-foreground"
        >
          {t(
            "Tell us what happened and what you expected. Do not include passwords or verification codes.",
          )}
        </p>
        {touched.description && errors.description && (
          <p
            id="ticket-description-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {t(errors.description)}
          </p>
        )}
      </div>
      <Button
        type="submit"
        disabled
        aria-describedby="ticket-availability"
        className="min-h-11 rounded-xl px-5"
      >
        {t("Submit")}
      </Button>
    </form>
  );
}
