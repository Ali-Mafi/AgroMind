"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { writeSupport } from "@/features/support/services/actions";
import { Button } from "@/components/ui/button";
import { PreferenceSelect } from "@/features/settings/components/preference-select";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { useSettings } from "@/features/settings/context/settings-context";
import { SUPPORT_CATEGORIES } from "../constants/help";
import { validateSupportDraft, type SupportDraft } from "../lib/support-draft";

export function SupportTicketForm() {
  const t = useTranslation();
  const { language } = useSettings();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState("");
  const [requestId, setRequestId] = useState("");
  const [draft, setDraft] = useState<SupportDraft>({
    subject: "",
    category: "",
    description: "",
  });
  const [touched, setTouched] = useState<
    Partial<Record<keyof SupportDraft, boolean>>
  >({});
  const errors = validateSupportDraft(draft);
  const update = (key: keyof SupportDraft, value: string) => {
    setRequestId("");
    setDraft((current) => ({ ...current, [key]: value }));
  };
  return (
    <form
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        setTouched({ subject: true, category: true, description: true });
        if (pending || Object.keys(errors).length) return;
        const id = requestId || crypto.randomUUID();
        setRequestId(id);
        setPending(true);
        setFailure("");
        try {
          const result = await writeSupport({
            action: "create",
            requestId: id,
            subject: draft.subject,
            category: draft.category,
            body: draft.description,
            language: language === "fa" ? "fa" : "en",
          });
          if (result.error) setFailure(result.error);
          else router.push(`/account/help/tickets/${result.id}`);
        } catch {
          setFailure("Support is unavailable. Please try again.");
        } finally {
          setPending(false);
        }
      }}
      className="space-y-5"
    >
      {failure && (
        <p role="alert" className="text-sm text-destructive">
          {t(failure)}
        </p>
      )}
      <fieldset disabled={pending} className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="ticket-subject"
            className="block text-sm font-semibold"
          >
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
        {touched.category && errors.category && (
          <p role="alert">{t(errors.category)}</p>
        )}
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
          disabled={pending}
          className="min-h-11 rounded-xl px-5"
        >
          {pending ? t("Sending…") : t("Submit")}
        </Button>
      </fieldset>
    </form>
  );
}
