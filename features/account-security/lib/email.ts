import { renderPremiumEmail } from "@/lib/email/layout";
import { locationLabel } from "./metadata";
import type { SessionMetadata } from "../types/security";

export function loginSecurityEmail(details: { metadata?: SessionMetadata; provider?: string; loginAt?: string }, language: string) {
  const fa = language === "fa";
  const m = details.metadata ?? {};
  const deviceNames: Record<string, string> = { Mobile: "تلفن همراه", Tablet: "تبلت", Computer: "رایانه" };
  const providerNames: Record<string, string> = fa ? { password: "رمز عبور", google: "Google", oauth: "ورود با سرویس دیگر", recovery: "بازیابی حساب" } : { password: "Password", google: "Google", oauth: "OAuth", recovery: "Account recovery" };
  const unknown = fa ? "در دسترس نیست" : "Unavailable";
  const date = details.loginAt ? new Date(details.loginAt) : null;
  const timeZone = fa ? "Asia/Tehran" : "UTC";
  const time = date && Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat(fa ? "fa-IR-u-ca-persian" : "en-GB", { dateStyle: "long", timeStyle: "long", timeZone }).format(date) : unknown;
  const location = locationLabel(m);
  return renderPremiumEmail({
    language: fa ? "fa" : "en",
    subject: fa ? "ورود جدید به حساب AgroMind شما" : "New sign-in to your AgroMind account",
    eyebrow: fa ? "امنیت حساب" : "ACCOUNT SECURITY",
    title: fa ? "ورود جدید به حساب شما" : "A new sign-in to your account",
    subtitle: fa ? "یک نشست جدید با موفقیت ایجاد شد." : "A new authenticated session was established.",
    paragraphs: [fa ? "جزئیات ورود را بررسی کنید. مکان تقریبی است و ممکن است محل VPN یا شبکه شما را نشان دهد. اطلاعات دستگاه از مرورگر گزارش شده است." : "Review this sign-in. Location is approximate and may reflect a VPN or network. Device information is reported by the browser."],
    metadata: [
      { label: fa ? "نوع دستگاه" : "Device category", value: fa ? deviceNames[m.device ?? ""] ?? "دستگاه نامشخص" : m.device ?? "Unknown device" },
      { label: fa ? "سیستم‌عامل" : "Operating system", value: m.os === "Unknown operating system" ? unknown : m.os ?? unknown },
      { label: fa ? "مرورگر" : "Browser", value: m.browser === "Unknown browser" ? unknown : m.browser ?? unknown },
      { label: fa ? "مکان تقریبی" : "Approximate location", value: location === "Unknown location" && fa ? "مکان نامشخص" : location },
      { label: fa ? "نشانی IP عمومی" : "Public IP address", value: m.ip ?? unknown },
      { label: fa ? "زمان ورود — تهران" : "Login date and time — UTC", value: time },
      { label: fa ? "روش ورود" : "Authentication method", value: providerNames[details.provider ?? ""] ?? unknown },
    ],
    action: { label: fa ? "بررسی امنیت حساب" : "Review Account Security", href: "https://agromind.ir/account/security" },
    information: { title: fa ? "این ورود را نمی‌شناسید؟" : "Do not recognize this sign-in?", paragraphs: [fa ? "امنیت حساب را باز کنید، نشست‌های دیگر را ببندید و رمز عبور خود را تغییر دهید. برای خروج از دستگاه‌های دیگر به کد تازه برنامه احراز هویت نیاز دارید." : "Open Account Security, sign out other sessions and change your password. Remote sign-out requires a fresh authenticator code."] },
  });
}
