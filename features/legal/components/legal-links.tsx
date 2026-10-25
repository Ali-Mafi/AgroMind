"use client";
import Link from "next/link";
import { useSettings } from "@/features/settings/context/settings-context";
import { LINKS } from "../content";
export function LegalLinks() {
  const { language } = useSettings();
  return <nav aria-label={language === "fa" ? "اسناد حقوقی" : "Legal documents"} className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
    {LINKS.map(([kind,href,en,fa]) => <Link key={kind} href={href} className="inline-flex min-h-10 items-center text-muted-foreground hover:text-primary hover:underline">{language === "fa" ? fa : en}</Link>)}
  </nav>;
}
