"use client";
import Link from "next/link";
import { useSettings } from "@/features/settings/context/settings-context";
export function LegalSignupNotice() {
  const { language } = useSettings();
  return <p className="mt-5 text-center text-xs leading-6 text-muted-foreground">
    {language === "fa" ? "پیش از ثبت‌نام می‌توانید " : "Before signing up, review our "}
    <Link href="/terms" className="font-semibold text-primary hover:underline">{language === "fa" ? "شرایط استفاده" : "Terms of Service"}</Link>
    {language === "fa" ? "، " : ", "}
    <Link href="/privacy" className="font-semibold text-primary hover:underline">{language === "fa" ? "حریم خصوصی" : "Privacy Policy"}</Link>
    {language === "fa" ? " و " : " and "}
    <Link href="/cookies" className="font-semibold text-primary hover:underline">{language === "fa" ? "سیاست کوکی‌ها" : "Cookie Policy"}</Link>
    {language === "fa" ? " را مطالعه کنید." : "."}
  </p>;
}
