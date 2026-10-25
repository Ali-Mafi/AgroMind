"use client";
import { LegalLink } from "./legal-link";
import { useSettings } from "@/features/settings/context/settings-context";
import { LEGAL_UI, LINKS } from "../content";
export function LegalLinks() {
  const { language } = useSettings();
  return <nav aria-label={LEGAL_UI[language === "fa" ? "fa" : "en"].navigation} className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
    {LINKS.map(([kind, ,en,fa]) => <LegalLink key={kind} kind={kind} className="inline-flex min-h-10 items-center text-muted-foreground hover:text-primary hover:underline">{language === "fa" ? fa : en}</LegalLink>)}
  </nav>;
}
