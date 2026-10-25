"use client";
import Link from "next/link";
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
    <Link href="/terms" className="font-semibold text-primary hover:underline">{label("terms")}</Link>
    {ui.signupSeparator}
    <Link href="/privacy" className="font-semibold text-primary hover:underline">{label("privacy")}</Link>
    {ui.signupAnd}
    <Link href="/cookies" className="font-semibold text-primary hover:underline">{label("cookies")}</Link>
    {ui.signupEnd}
  </p>;
}
