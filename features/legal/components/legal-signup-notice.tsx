"use client";
import { useSettings } from "@/features/settings/context/settings-context";
import { LEGAL_SIGNUP_AGREEMENT } from "../content";
import { LegalLink } from "./legal-link";
import { useSignupConsent } from "./signup-consent";

// Links are outside the label to prevent opening a policy from checking the box.
export function LegalSignupNotice() {
  const { language } = useSettings();
  const consent = useSignupConsent();
  const fa = language === "fa";
  const copy = LEGAL_SIGNUP_AGREEMENT[fa ? "fa" : "en"];
  if (!consent) return null;
  return <div className="mb-5 rounded-2xl border border-border bg-muted/20 p-4" dir={fa ? "rtl" : "ltr"}>
    <div className="flex items-start gap-3">
      <input id="signup-terms-agreement" type="checkbox" checked={consent.accepted}
        onChange={event => consent.setAccepted(event.target.checked)}
        required aria-required="true" className="mt-1 size-5 shrink-0 cursor-pointer accent-primary" />
      <div className="min-w-0">
        <label htmlFor="signup-terms-agreement" className="cursor-pointer text-sm font-semibold leading-7 text-foreground">
          {copy.label}
        </label>
        <p className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs leading-6 text-muted-foreground">
          <span>{copy.details}</span>
          <LegalLink kind="terms" className="font-semibold text-primary underline-offset-4 hover:underline">{copy.terms}</LegalLink>
          <LegalLink kind="privacy" className="font-semibold text-primary underline-offset-4 hover:underline">{copy.privacy}</LegalLink>
          <LegalLink kind="cookies" className="font-semibold text-primary underline-offset-4 hover:underline">{copy.cookies}</LegalLink>
        </p>
        <p className="mt-1 text-xs leading-6 text-muted-foreground">{copy.hint}</p>
      </div>
    </div>
  </div>;
}
