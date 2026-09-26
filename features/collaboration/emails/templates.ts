import { translator } from "@/features/settings/lib/translation";
import type { TeamRole } from "../types";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderFarmInvitationEmail({
  href,
  farmName,
  role,
  language,
}: {
  href: string;
  farmName: string;
  role: TeamRole;
  language: "en" | "fa";
}) {
  const t = translator(language);
  const safeHref = escapeHtml(href);
  const safeFarm = escapeHtml(farmName);
  const roleLabel = escapeHtml(
    t(role === "manager" ? "Manager" : role === "worker" ? "Worker" : "Viewer"),
  );
  const subject = t("You're invited to collaborate in AgroMind");
  const title = t("A farm has been shared with you");
  const intro = t(
    "You've been invited to help manage {farm} with the {role} role.",
    { farm: safeFarm, role: roleLabel },
  );
  const cta = t("Review invitation");
  const note = t(
    "This invitation expires in 7 days and can only be accepted by the email address that received it.",
  );
  const ignore = t(
    "If you were not expecting this invitation, you can safely ignore this email.",
  );

  const html = `<!doctype html>
<html lang="${language}" dir="${language === "fa" ? "rtl" : "ltr"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><title>${subject}</title>
<style>@media(prefers-color-scheme:dark){body,.outer{background:#101c16!important}.card{background:#182820!important;color:#f4f7f5!important}.muted{color:#b6c5bc!important}.brand{color:#8bd6a8!important}}</style></head>
<body style="margin:0;background:#f4f7f4;color:#153c29;font-family:Tahoma,Arial,sans-serif">
<table role="presentation" class="outer" width="100%" style="padding:32px 16px;background:#f4f7f4"><tr><td align="center">
<table role="presentation" class="card" width="100%" style="max-width:560px;background:#fff;border:1px solid #dce8df;border-top:4px solid #c6a557;border-radius:20px;padding:32px 24px">
<tr><td><p class="brand" dir="ltr" style="margin:0 0 28px;color:#227746;font-size:24px;font-weight:700">AgroMind</p>
<h1 style="margin:0 0 16px;font-size:26px;line-height:1.6">${title}</h1>
<p class="muted" style="margin:0 0 28px;color:#52655a;font-size:15px;line-height:1.9">${intro}</p>
<p style="margin:0 0 28px"><a href="${safeHref}" style="display:inline-block;background:#227746;color:#fff;padding:15px 28px;border-radius:12px;text-decoration:none;font-size:15px;font-weight:700">${cta}</a></p>
<p class="muted" style="color:#52655a;font-size:13px;line-height:1.9">${note}</p>
<p class="muted" style="border-top:1px solid #dce8df;margin-top:24px;padding-top:20px;color:#52655a;font-size:12px;line-height:1.9">${ignore}</p>
</td></tr></table></td></tr></table></body></html>`;

  const text = [
    "AgroMind",
    title,
    t("You've been invited to help manage {farm} with the {role} role.", {
      farm: farmName,
      role: t(
        role === "manager" ? "Manager" : role === "worker" ? "Worker" : "Viewer",
      ),
    }),
    cta + ": " + href,
    note,
    ignore,
  ].join("\n\n");

  return { subject, html, text };
}
