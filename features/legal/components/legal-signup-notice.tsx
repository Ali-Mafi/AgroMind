"use client";
import Link from "next/link";
import { useSettings } from "@/features/settings/context/settings-context";
import { LEGAL_NAV, LEGAL_UI } from "../content";
export function LegalSignupNotice() {
 const { language } = useSettings();
 const lang = language === "fa" ? "fa" : "en";
 const c = LEGAL_UI[lang].signup;
 return <p className="mt-5 text-center text-xs leading-6 text-muted-foreground" lang={lang} dir={lang === "fa" ? "rtl" : "ltr"}>
  {c[0]}{" "}
  <Link href="/terms" className="font-semibold text-primary hover:underline">{lang === "fa" ? LEGAL_NAV[2][3] : LEGAL_NAV[2][2]}</Link>
  {" "}{c[1]}{" "}
  <Link href="/privacy" className="font-semibold text-primary hover:underline">{lang === "fa" ? LEGAL_NAV[0][3] : LEGAL_NAV[0][2]}</Link>
  {c[2]}{" "}
  <Link href="/cookies" className="font-semibold text-primary hover:underline">{lang === "fa" ? LEGAL_NAV[1][3] : LEGAL_NAV[1][2]}</Link>
  {c[3]}
 </p>;
}
