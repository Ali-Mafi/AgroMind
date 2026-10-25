"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/features/settings/context/settings-context";
import { GOOGLE_TERMS_GATE } from "@/features/legal/content";
import { LegalLink } from "@/features/legal/components/legal-link";
import { acceptGoogleTermsAction, declineGoogleTermsAction } from "../services/accept-terms";

export function GoogleTermsStep({ next }: { next: string }) {
  const { language } = useSettings();
  const copy = GOOGLE_TERMS_GATE[language === "fa" ? "fa" : "en"];
  const [accepted, setAccepted] = useState(false);
  const [state, action, pending] = useActionState(acceptGoogleTermsAction, {});

  return <div className="space-y-5" dir={language === "fa" ? "rtl" : "ltr"}>
    <p className="text-sm leading-7 text-muted-foreground">{copy.description}</p>
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-7">
        <input type="checkbox" name="accepted_terms" value="on" checked={accepted}
          onChange={event => setAccepted(event.target.checked)} required aria-required="true"
          className="mt-1.5 size-5 shrink-0 accent-primary" />
        <span>{copy.label}</span>
      </label>
      <nav aria-label={copy.terms} className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
        <LegalLink kind="terms" className="text-primary underline-offset-4 hover:underline">{copy.terms}</LegalLink>
        <LegalLink kind="privacy" className="text-primary underline-offset-4 hover:underline">{copy.privacy}</LegalLink>
        <LegalLink kind="cookies" className="text-primary underline-offset-4 hover:underline">{copy.cookies}</LegalLink>
      </nav>
      {state.error && <p role="alert" className="text-sm text-destructive">
        {state.error === "required" ? copy.error : copy.unavailable}
      </p>}
      <Button type="submit" disabled={!accepted || pending} className="min-h-12 w-full rounded-xl">
        {pending ? copy.loading : copy.continue}
      </Button>
    </form>
    <form action={declineGoogleTermsAction}>
      <button type="submit" className="flex min-h-11 w-full items-center justify-center text-sm text-muted-foreground hover:text-foreground">
        {copy.decline}
      </button>
    </form>
  </div>;
}
