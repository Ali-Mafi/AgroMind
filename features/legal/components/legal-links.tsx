"use client";
import Link from "next/link";
import { useSettings } from "@/features/settings/context/settings-context";
import { LEGAL_NAV, LEGAL_UI } from "../content";
export function LegalLinks({ compact = false }: { compact?: boolean }) {
 const { language } = useSettings();
 const lang = language === "fa" ? "fa" : "en";
 return <nav aria-label={LEGAL_UI[lang].nav} className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
  {LEGAL_NAV.map(([id,href,en,fa]) => <Link key={id} href={href} className="inline-flex min-h-10 items-center text-muted-foreground underline-offset-4 hover:text-primary hover:underline">{lang === "fa" ? fa : en}</Link>)}
  {!compact && <a href="mailto:support@agromind.ir" className="inline-flex min-h-10 items-center text-muted-foreground hover:text-primary">support@agromind.ir</a>}
 </nav>;
}
