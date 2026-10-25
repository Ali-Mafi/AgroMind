"use client";
import { useSettings } from "@/features/settings/context/settings-context";
import { LEGAL_SIGNUP_AGREEMENT } from "../content";
import { LegalLink } from "./legal-link";
import { useSignupConsent } from "./signup-consent";

// Compact checkbox directly before the final email signup button.
// Legal links deliberately sit outside the checkbox label.
export function LegalSignupNotice() {
  const { language } = useSettings();
  const consent = useSignupConsent();
  const copy = LEGAL_SIGNUP_AGREEMENT[language === "fa" ? "fa" : "en"];
  if (!consent) return null;
  return <div className="flex items-start gap-2 py-1" dir={language === "fa" ? "rtl" : "ltr"}>
    <input id="signup-terms-agreement" type="checkbox" checked={consent.accepted}
      onChange={event => consent.setAccepted(event.target.checked)} required
      aria-required="true" className="mt-1 size-4 shrink-0 cursor-pointer accent-primary" />
    <div className="min-w-0 space-y-1 text-xs leading-5">
      <label htmlFor="signup-terms-agreement" className="cursor-pointer font-medium text-foreground">
        {copy.label}
      </label>
      <div className="flex flex-wrap gap-x-2 gap-y-1 text-muted-foreground">
        <LegalLink kind="terms" className="text-primary underline-offset-4 hover:underline">{copy.terms}</LegalLink>
        <span aria-hidden="true">·</span>
        <LegalLink kind="privacy" className="text-primary underline-offset-4 hover:underline">{copy.privacy}</LegalLink>
        <span aria-hidden="true">·</span>
        <LegalLink kind="cookies" className="text-primary underline-offset-4 hover:underline">{copy.cookies}</LegalLink>
      </div>
    </div>
  </div>;
}
