import { translator } from "@/features/settings/lib/translation";
import { renderPremiumEmail } from "@/lib/email/layout";
import { siteOrigin } from "../lib/redirects";
import { tokenHashSchema } from "../lib/validation";

export type AuthEmailKind = "signup" | "recovery";
export function renderAuthEmail(
  kind: AuthEmailKind,
  tokenHash: string,
  language: "en" | "fa" = "en",
) {
  const token = tokenHashSchema.parse(tokenHash);
  const url = new URL("/auth/callback", siteOrigin());
  url.searchParams.set("token_hash", token);
  url.searchParams.set("type", kind);
  const t = translator(language);
  const fa = language === "fa";
  const signup = kind === "signup";
  // Production Email OTP Expiration was confirmed as 3600 seconds by the
  // project owner in the Supabase Auth dashboard on 2026-10-28.
  // Update this notice if the hosted authentication setting changes.
  const content = signup ? {
    subject: fa ? "تأیید نشانی ایمیل | AgroMind" : "Verify your email address | AgroMind",
    title: fa ? "تأیید نشانی ایمیل" : "Verify your email address",
    subtitle: fa ? "یک گام تا شروع مسیر هوشمند کشاورزی" : "One step towards intelligent agriculture",
    paragraphs: fa ? [
      "از ثبت‌نام شما در AgroMind سپاسگزاریم.",
      "برای فعال‌سازی حساب کاربری و تکمیل فرایند ثبت‌نام، لطفاً روی دکمه زیر کلیک کنید و نشانی ایمیل خود را تأیید کنید.",
    ] : [
      "Thank you for registering with AgroMind.",
      "To activate your account and complete registration, please click the button below to verify your email address.",
    ],
    cta: fa ? "تأیید نشانی ایمیل" : "Verify email address",
    note: fa ? "این لینک به دلایل امنیتی تنها یک‌بار قابل استفاده است و تا ۱ ساعت اعتبار دارد." : "For security reasons, this link can only be used once and is valid for one hour.",
    ignore: fa ? "اگر این درخواست از طرف شما نبوده است، نیازی به اقدامی نیست و می‌توانید این ایمیل را نادیده بگیرید." : "If you did not make this request, no action is needed and you can ignore this email.",
  } : {
    subject: t("Reset your AgroMind password"),
    title: t("Reset password"),
    subtitle: fa ? "بازیابی دسترسی به حساب کاربری" : "Recover access to your account",
    paragraphs: [t("Use the secure link below to choose a new password for your AgroMind account.")],
    cta: t("Reset password"),
    note: t("This link can be used once. If it has expired, request another email from AgroMind."),
    ignore: t("If you did not request this email, you can safely ignore it."),
  };
  return renderPremiumEmail({
    language, subject: content.subject, eyebrow: fa ? "حساب کاربری" : "ACCOUNT",
    title: content.title, titleAccent: signup ? (fa ? "ایمیل" : "email address") : undefined, subtitle: content.subtitle,
    greeting: fa ? "کاربر گرامی،" : "Dear user,", paragraphs: content.paragraphs,
    action: { label: content.cta, href: url.toString() },
    information: { title: fa ? "اطلاع‌رسانی امنیتی" : "Security information", paragraphs: [content.note] },
    afterInformation: [content.ignore],
  });
}
