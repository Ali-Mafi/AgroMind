import { translator } from "@/features/settings/lib/translation";
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
  const href = url.toString();
  const t = translator(language);
  const words = {
    note: t(
      "This link can be used once. If it has expired, request another email from AgroMind.",
    ),
    ignore: t("If you did not request this email, you can safely ignore it."),
  };
  const content =
    kind === "signup"
      ? {
          subject: t("Verify your AgroMind email"),
          title: t("Welcome to AgroMind"),
          intro: t(
            "Verify your email to set up your account and start managing your farms.",
          ),
          cta: t("Verify email"),
        }
      : {
          subject: t("Reset your AgroMind password"),
          title: t("A fresh start, securely"),
          intro: t(
            "Use the secure link below to choose a new password for your AgroMind account.",
          ),
          cta: t("Reset password"),
        };
  // Only fixed localized text and an allowlisted origin with validated OTP hash
  // enter HTML. User metadata and untrusted redirect URLs are never interpolated.
  const html = `<!doctype html>
<html lang="${language}" dir="${language === "fa" ? "rtl" : "ltr"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><title>${content.subject}</title>
<style>@media(prefers-color-scheme:dark){body,.outer{background:#101c16!important}.card{background:#182820!important;color:#f4f7f5!important}.muted{color:#b6c5bc!important}.brand{color:#8bd6a8!important}}</style></head>
<body style="margin:0;background:#f4f7f4;color:#153c29;font-family:Tahoma,Arial,sans-serif">
<table role="presentation" class="outer" width="100%" style="padding:32px 16px;background:#f4f7f4"><tr><td align="center">
<table role="presentation" class="card" width="100%" style="max-width:560px;background:#fff;border:1px solid #dce8df;border-top:4px solid #c6a557;border-radius:20px;padding:32px 24px">
<tr><td><p class="brand" dir="ltr" style="margin:0 0 28px;color:#227746;font-size:24px;font-weight:700">AgroMind</p>
<h1 style="margin:0 0 16px;font-size:26px;line-height:1.6">${content.title}</h1>
<p class="muted" style="margin:0 0 28px;color:#52655a;font-size:15px;line-height:1.9">${content.intro}</p>
<p style="margin:0 0 28px"><a href="${href.replaceAll("&", "&amp;")}" style="display:inline-block;background:#227746;color:#fff;padding:15px 28px;border-radius:12px;text-decoration:none;font-size:15px;font-weight:700">${content.cta}</a></p>
<p class="muted" style="color:#52655a;font-size:13px;line-height:1.9">${words.note}</p>
<p class="muted" style="border-top:1px solid #dce8df;margin-top:24px;padding-top:20px;color:#52655a;font-size:12px;line-height:1.9">${words.ignore}</p>
</td></tr></table></td></tr></table></body></html>`;
  const text = [
    "AgroMind",
    content.title,
    content.intro,
    content.cta + ": " + href,
    words.note,
    words.ignore,
  ].join("\n\n");
  return { subject: content.subject, html, text };
}
