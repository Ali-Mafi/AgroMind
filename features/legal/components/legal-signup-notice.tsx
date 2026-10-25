"use client";
import { useSettings } from "@/features/settings/context/settings-context";
import { LegalLink } from "./legal-link";
import { useSignupConsent } from "./signup-consent";

export function LegalSignupNotice() {
  const { language } = useSettings();
  const consent = useSignupConsent();
  const fa = language === "fa";
  if (!consent) return null;
  return <div className="mb-5 rounded-2xl border border-border bg-muted/20 p-4" dir={fa ? "rtl" : "ltr"}>
    <div className="flex items-start gap-3">
      <input id="signup-terms-agreement" type="checkbox" checked={consent.accepted}
        onChange={event => consent.setAccepted(event.target.checked)}
        required aria-required="true" className="mt-1 size-5 shrink-0 cursor-pointer accent-primary" />
      <label htmlFor="signup-terms-agreement" className="cursor-pointer text-sm leading-7 text-foreground">
        {fa ? "من " : "I agree to the "}
        <LegalLink kind="terms" className="font-semibold text-primary underline-offset-4 hover:underline">{fa ? "قوانین و مقررات و شرایط استفاده" : "Terms of Service"}</LegalLink>
        {fa ? " را می‌پذیرم و " : " and have read the "}
        <LegalLink kind="privacy" className="font-semibold text-primary underline-offset-4 hover:underline">{fa ? "سیاست حریم خصوصی" : "Privacy Policy"}</LegalLink>
        {fa ? " و " : " and "}
        <LegalLink kind="cookies" className="font-semibold text-primary underline-offset-4 hover:underline">{fa ? "سیاست کوکی‌ها" : "Cookie Policy"}</LegalLink>
        {fa ? " را مطالعه کرده‌ام." : "."}
      </label>
    </div>
    <p className="mt-2 text-xs leading-6 text-muted-foreground">
      {fa ? "برای ساخت حساب، این گزینه را علامت بزنید." : "Check this box to create your account."}
    </p>
  </div>;
}
