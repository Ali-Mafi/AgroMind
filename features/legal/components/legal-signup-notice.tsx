"use client";
import { LegalLink } from "./legal-link";
import { useSettings } from "@/features/settings/context/settings-context";
import { LEGAL_UI, LINKS } from "../content";
export function LegalSignupNotice() {
  const { language } = useSettings();
  const fa = language === "fa";
  const ui = LEGAL_UI[fa ? "fa" : "en"];
  const label = (kind: "privacy" | "cookies" | "terms") => {
    const item = LINKS.find(([key]) => key === kind);
    return item ? item[fa ? 3 : 2] : "";
  };
  return <p className="mt-5 text-center text-xs leading-6 text-muted-foreground">
    {ui.signupStart}
    <LegalLink kind="terms" className="font-semibold text-primary hover:underline">{label("terms")}</LegalLink>
    {ui.signupSeparator}
    <LegalLink kind="privacy" className="font-semibold text-primary hover:underline">{label("privacy")}</LegalLink>
    {ui.signupAnd}
    <LegalLink kind="cookies" className="font-semibold text-primary hover:underline">{label("cookies")}</LegalLink>
    {ui.signupEnd}
  </p>;
}
