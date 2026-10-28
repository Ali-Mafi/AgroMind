/** Shared Signature Premium shell. Content is always text, escaped at this boundary. */
export type EmailLanguage = "fa" | "en";
export type PremiumEmail = {
  language: EmailLanguage;
  subject: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  greeting?: string;
  paragraphs: string[];
  action: { label: string; href: string };
  metadata?: { label: string; value: string }[];
  information: { title: string; paragraphs: string[] };
};

const origin = "https://agromind.ir";
const assets = `${origin}/email/signature-v1`;
export const EMAIL_SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/agromind.ir/",
  telegram: "https://t.me/agromindir",
  website: origin,
} as const;

export function escapeEmailHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

// Callers retain their existing origin/token validation; this prevents executable
// URL schemes from entering either the normal or Outlook button markup.
function actionUrl(value: string) {
  const url = new URL(value);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password)
    throw new Error("INVALID_EMAIL_URL");
  return url.href;
}

const table = 'role="presentation" border="0" cellpadding="0" cellspacing="0" align="center"';
const centered = 'align="center" style="text-align:center;';
const font = "Tahoma,Arial,Helvetica,sans-serif";
function paragraph(value: string, style = "") {
  return `<p style="margin:0 0 16px;text-align:center;font-size:15px;line-height:2;color:#40564a;overflow-wrap:anywhere;${style}">${escapeEmailHtml(value)}</p>`;
}

export function renderPremiumEmail(message: PremiumEmail) {
  const fa = message.language === "fa";
  const direction = fa ? "rtl" : "ltr";
  const e = escapeEmailHtml;
  const href = actionUrl(message.action.href);
  const safeHref = e(href);
  const brandLine = fa ? "مدیریت هوشمند کشاورزی" : "Intelligent farm management";
  const highlights = fa
    ? ["کشاورزی پایدار", "تصمیم‌های هوشمند", "همکاری مؤثر"]
    : ["Sustainable agriculture", "Smart decisions", "Effective collaboration"];
  const heroAlt = fa ? "ردیف‌های سبز مزرعهٔ گندم زیر آسمان غروب" : "Green rows of a wheat field beneath a sunset sky";
  const metadata = (message.metadata ?? []).map(({label, value}) =>
    `<tr><td ${centered}padding:0 0 18px;"><p style="margin:0 0 5px;text-align:center;font-size:12px;line-height:1.8;color:#697669;">${e(label)}</p><p dir="ltr" style="margin:0;text-align:center;font-size:19px;line-height:1.7;font-weight:bold;color:#194936;overflow-wrap:anywhere;word-break:break-word;">${e(value)}</p></td></tr>`).join("");
  const featureCells = highlights.map((label, index) => `<td class="highlight" width="33.33%" ${centered}width:33.33%;vertical-align:top;padding:10px 5px;"><table ${table} width="100%"><tr><td ${centered}padding:0 0 9px;"><img src="${assets}/highlight-${index + 1}.png" width="30" height="30" alt="" style="display:block;margin:0 auto;border:0;"></td></tr><tr><td ${centered}font-size:12px;line-height:1.9;color:#40564a;">${e(label)}</td></tr></table></td>`).join("");
  const social = (name: "instagram" | "telegram", label: string, handle: string) => `<td width="50%" ${centered}width:50%;vertical-align:top;padding:8px 4px;"><a href="${EMAIL_SOCIAL_LINKS[name]}" style="display:inline-block;text-align:center;color:#fff9e9;text-decoration:none;font-size:12px;line-height:1.9;"><img src="${assets}/${name}.png" width="24" height="24" alt="" style="display:block;margin:0 auto 7px;border:0;"><span style="display:block;text-align:center;">${label}</span><span dir="ltr" style="display:block;text-align:center;color:#e1ce95;">${handle}</span></a></td>`;

  const html = `<!doctype html>
<html lang="${message.language}" dir="${direction}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${e(message.subject)}</title>
<!--[if mso]><xml><o:OfficeDocumentSettings xmlns:o="urn:schemas-microsoft-com:office:office"><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
<style>
:root{color-scheme:light dark;supported-color-schemes:light dark}
body,table,td,p,h1,h2,a{text-align:center}table{mso-table-lspace:0pt;mso-table-rspace:0pt}img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic}a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}
@media screen and (max-width:480px){.outer-pad{padding:16px 10px!important}.content-pad{padding-left:22px!important;padding-right:22px!important}.email-title{font-size:24px!important}.highlight{display:block!important;width:100%!important;padding:10px 0!important}.hero{height:auto!important}.brand-header{padding-top:26px!important;padding-bottom:24px!important}}
@media(prefers-color-scheme:dark){body,.outer{background-color:#17251e!important}.card,.content-surface{background-color:#fffaf0!important}.info-panel{background-color:#f0f2e8!important}.email-title{color:#194936!important}.brand-header,.footer{background-color:#123b2b!important}}
[data-ogsc] .outer{background-color:#17251e!important}[data-ogsc] .card,[data-ogsc] .content-surface{background-color:#fffaf0!important}[data-ogsc] .brand-header,[data-ogsc] .footer{background-color:#123b2b!important}
</style></head>
<body style="margin:0;padding:0;width:100%;text-align:center;background-color:#f2eedf;color:#194936;font-family:${font};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none!important;max-height:0;overflow:hidden;mso-hide:all;text-align:center;">${e(message.subtitle ?? message.title)}</div>
<table ${table} width="100%" class="outer" bgcolor="#f2eedf" style="width:100%;background-color:#f2eedf;"><tr><td class="outer-pad" ${centered}padding:32px 12px;">
<!--[if mso]><table ${table} width="600"><tr><td align="center" style="text-align:center;"><![endif]-->
<table ${table} width="100%" class="card" bgcolor="#fffaf0" data-email-layout="signature-premium-v1" dir="${direction}" style="width:100%;max-width:600px;table-layout:fixed;background-color:#fffaf0;border:1px solid #e2dcc8;border-radius:20px;border-spacing:0;overflow:hidden;">
<tr><td class="brand-header" bgcolor="#123b2b" ${centered}padding:30px 24px 27px;background-color:#123b2b;border-radius:19px 19px 0 0;border-top:3px solid #bea063;">
<table ${table} width="100%"><tr><td ${centered}padding:0 0 9px;"><a href="${origin}" style="display:inline-block;text-align:center;"><img src="${assets}/logo.png" width="58" height="58" alt="AgroMind" style="display:block;margin:0 auto;border:0;color:#fffaf0;font-size:12px;"></a></td></tr>
<tr><td ${centered}"><p dir="ltr" style="margin:0;text-align:center;color:#fffaf0;font-family:Arial,Helvetica,sans-serif;font-size:29px;font-weight:bold;line-height:1.4;letter-spacing:1px;">AgroMind</p><p style="margin:7px 0 0;text-align:center;color:#e1ce95;font-size:11px;line-height:1.8;">${brandLine}</p></td></tr></table>
</td></tr>
<tr><td bgcolor="#dfe5d0" ${centered}background-color:#dfe5d0;color:#194936;"><img class="hero" src="${assets}/wheat-field.jpg" width="600" height="210" alt="${heroAlt}" style="display:block;width:100%;max-width:600px;height:auto;margin:0 auto;color:#194936;font-size:13px;line-height:1.8;text-align:center;"></td></tr>
<tr><td class="content-pad content-surface" ${centered}padding:32px 42px 0;background-color:#fffaf0;">
<p style="margin:0 0 10px;text-align:center;color:#79602b;font-size:11px;font-weight:bold;line-height:1.8;">${e(message.eyebrow)}</p>
<h1 class="email-title" style="margin:0 0 8px;text-align:center;color:#194936;font-size:28px;font-weight:bold;line-height:1.6;">${e(message.title)}</h1>
${message.subtitle ? paragraph(message.subtitle, "font-size:14px;color:#657261;margin-bottom:0;") : ""}
<table ${table} width="44" style="width:44px;"><tr><td height="23" ${centered}height:23px;border-bottom:1px solid #bea063;font-size:0;line-height:0;">&nbsp;</td></tr></table>
</td></tr>
<tr><td class="content-pad content-surface" ${centered}padding:25px 42px 4px;background-color:#fffaf0;">
${message.greeting ? paragraph(message.greeting, "font-weight:bold;color:#194936;") : ""}
${message.paragraphs.map((value) => paragraph(value)).join("")}
</td></tr>
${metadata ? `<tr><td class="content-pad" ${centered}padding:5px 42px 0;"><table ${table} width="100%" style="width:100%;table-layout:fixed;">${metadata}</table></td></tr>` : ""}
<tr><td class="content-pad" ${centered}padding:9px 22px 30px;">
<!--[if mso]><table ${table} width="280"><tr><td align="center" style="text-align:center;"><![endif]-->
<table ${table} width="100%" style="width:100%;max-width:280px;table-layout:fixed;"><tr><td bgcolor="#246545" ${centered}background-color:#246545;border-radius:14px;">
<!--[if mso]><v:roundrect href="${safeHref}" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="27%" stroke="f" fillcolor="#246545"><w:anchorlock/><center dir="${direction}" style="color:#ffffff;font-family:${font};font-size:15px;font-weight:bold;text-align:center;">${e(message.action.label)}</center></v:roundrect><![endif]-->
<!--[if !mso]><!--><a data-email-cta="primary" href="${safeHref}" style="display:block;padding:15px 8px;text-align:center;border-radius:14px;color:#ffffff;font-size:15px;font-weight:bold;line-height:22px;text-decoration:none;">${e(message.action.label)}</a><!--<![endif]-->
</td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
<tr><td class="content-pad" ${centered}padding:0 34px 26px;">
<table ${table} width="100%" class="info-panel" bgcolor="#f0f2e8" style="width:100%;background-color:#f0f2e8;border:1px solid #dce3ce;border-radius:14px;"><tr><td ${centered}padding:22px 22px 8px;">
<img src="${assets}/shield.png" width="26" height="26" alt="" style="display:block;margin:0 auto 9px;"><h2 style="margin:0 0 12px;text-align:center;color:#194936;font-size:14px;line-height:1.8;">${e(message.information.title)}</h2>
${message.information.paragraphs.map((value) => paragraph(value, "font-size:12px;line-height:2;color:#52634f;margin-bottom:14px;")).join("")}
</td></tr></table></td></tr>
<tr><td ${centered}padding:0 34px;"><table ${table} width="100%" style="width:100%;border-top:1px solid #e2dcc8;"><tr><td ${centered}padding:18px 0 20px;"><table ${table} width="100%" dir="${direction}" style="width:100%;table-layout:fixed;"><tr>${featureCells}</tr></table></td></tr></table></td></tr>
<tr><td class="content-surface" ${centered}background-color:#fffaf0;font-size:0;line-height:0;"><img src="${assets}/footer-curve.png" width="600" height="36" alt="" style="display:block;margin:0 auto;width:100%;max-width:600px;height:auto;"></td></tr>
<tr><td class="footer" bgcolor="#123b2b" ${centered}padding:16px 28px 29px;background-color:#123b2b;border-bottom:3px solid #bea063;border-radius:0 0 19px 19px;">
<p dir="ltr" style="margin:0 0 17px;text-align:center;color:#fffaf0;font-family:Arial,Helvetica,sans-serif;font-size:23px;font-weight:bold;line-height:1.6;">AgroMind</p>
<table ${table} width="100%" dir="ltr" style="width:100%;max-width:280px;table-layout:fixed;"><tr>${social("instagram", "Instagram", "agromind.ir")}${social("telegram", "Telegram", "agromindir")}</tr></table>
<table ${table} width="44" style="width:44px;"><tr><td height="15" ${centered}height:15px;border-bottom:1px solid #7c744b;font-size:0;line-height:0;">&nbsp;</td></tr></table>
<p dir="ltr" style="margin:17px 0 8px;text-align:center;font-size:12px;line-height:1.8;"><a href="${origin}" style="text-align:center;color:#fffaf0;text-decoration:none;">agromind.ir</a></p>
<p dir="ltr" style="margin:0;text-align:center;color:#d9d8bf;font-size:11px;line-height:1.8;">© ${new Date().getUTCFullYear()} AgroMind</p>
</td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
  const text = ["AgroMind", brandLine, message.title, message.subtitle, message.greeting,
    ...message.paragraphs, ...(message.metadata ?? []).map(({label,value}) => `${label}: ${value}`),
    `${message.action.label}: ${href}`, message.information.title, ...message.information.paragraphs,
    highlights.join(" | "), "AgroMind", `Instagram: agromind.ir — ${EMAIL_SOCIAL_LINKS.instagram}`,
    `Telegram: agromindir — ${EMAIL_SOCIAL_LINKS.telegram}`, origin, `© ${new Date().getUTCFullYear()} AgroMind`,
  ].filter(Boolean).join("\n\n");
  return { subject: message.subject, html, text };
}
