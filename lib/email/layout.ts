/** Shared Signature Premium shell. Content is always text, escaped at this boundary. */
export type EmailLanguage = "fa" | "en";
export type PremiumEmail = {
  language: EmailLanguage;
  subject: string;
  eyebrow: string;
  title: string;
  titleAccent?: string;
  subtitle?: string;
  greeting?: string;
  paragraphs: string[];
  action: { label: string; href: string };
  metadata?: { label: string; value: string }[];
  information: { title: string; paragraphs: string[] };
  afterInformation?: string[];
};

const origin = "https://agromind.ir";
const assets = `${origin}/email/signature-v1`;
const artwork = `${origin}/email/signature-v2`;
// A new stable URL bypasses email-image proxies that cached a missing asset
// during the initial release. This is only for decorative public image URLs.
const imageRevision = "?v=20261028r2";
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
const persianFont = "'Vazirmatn',Tahoma,Arial,Helvetica,sans-serif";
// Keep branding, headings and footer as ordinary HTML text across clients.
// Gmail iOS's screen/difference blend wrappers drew unwanted horizontal rules.
function paragraph(value: string, style = "", family = font) {
  return `<p style="margin:0 0 12px;text-align:center;font-size:15px;line-height:1.95;font-family:${family};color:#30382f;overflow-wrap:anywhere;${style}">${escapeEmailHtml(value)}</p>`;
}

export function renderPremiumEmail(message: PremiumEmail) {
  const fa = message.language === "fa";
  const emailFont = fa ? persianFont : font;
  const fontFaceCss = fa
    ? "@font-face{font-family:Vazirmatn;font-style:normal;font-weight:100 900;font-display:swap;src:url(https://agromind.ir/email/fonts/vazirmatn-variable.woff2) format('woff2')}"
    : "";
  const p = (value: string, style = "") => paragraph(value, style, emailFont);
  const direction = fa ? "rtl" : "ltr";
  const e = escapeEmailHtml;
  const href = actionUrl(message.action.href);
  const safeHref = e(href);
  const brandLine = fa ? "مدیریت هوشمند کشاورزی" : "Intelligent farm management";
  const highlights = fa
    ? ["کشاورزی پایدار", "تصمیم‌های هوشمند", "همکاری مؤثر"]
    : ["Sustainable agriculture", "Smart decisions", "Effective collaboration"];
  const highlightDetails = fa
    ? ["برای آینده‌ای بهتر", "با داده‌های واقعی", "میان کشاورزان و متخصصان"]
    : ["For a better future", "With real-world data", "Connecting farmers and experts"];
  const title = message.titleAccent && message.title.endsWith(message.titleAccent)
    ? `${e(message.title.slice(0, -message.titleAccent.length))}<span style="text-align:center;color:#d2b16c;">${e(message.titleAccent)}</span>`
    : e(message.title);
  const brand = (compact = false) => `<a href="${origin}" style="display:inline-block;text-align:center;text-decoration:none;"><img src="${artwork}/signature-leaf.png${imageRevision}" width="${compact ? 23 : 34}" height="${compact ? 32 : 48}" alt="" style="display:block;margin:0 auto 4px;border:0;"><span dir="ltr" style="display:block;text-align:center;color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-size:${compact ? 25 : 29}px;line-height:1.25;">AgroMind</span></a><p dir="ltr" style="margin:7px 0 0;text-align:center;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:8px;line-height:1.6;letter-spacing:2.5px;">INTELLIGENT<br>FARMING TOGETHER</p>`;
  const metadata = (message.metadata ?? []).map(({label, value}) =>
    `<tr><td ${centered}padding:0 0 18px;"><p style="margin:0 0 5px;text-align:center;font-size:12px;line-height:1.8;font-family:${emailFont};color:#697669;">${e(label)}</p><p dir="ltr" style="margin:0;text-align:center;font-size:19px;line-height:1.7;font-family:${emailFont};font-weight:bold;color:#194936;overflow-wrap:anywhere;word-break:break-word;">${e(value)}</p></td></tr>`).join("");
  const featureCells = highlights.map((label, index) => `<td class="highlight" dir="${direction}" width="33.33%" ${centered}width:33.33%;vertical-align:top;padding:8px 5px;${index ? "border-left:1px solid #ddd7c9;" : ""}"><table ${table} width="100%" style="width:100%;table-layout:fixed;"><tr><td ${centered}padding:0 0 8px;"><img src="${artwork}/highlight-${index + 1}.png${imageRevision}" width="30" height="30" alt="" style="display:block;margin:0 auto;border:0;"></td></tr><tr><td ${centered}overflow-wrap:anywhere;word-break:break-word;font-size:13px;font-weight:bold;line-height:1.9;font-family:${emailFont};color:#30382f;">${e(label)}</td></tr><tr><td ${centered}padding-top:4px;overflow-wrap:anywhere;word-break:break-word;font-size:11px;line-height:1.9;font-family:${emailFont};color:#73766b;">${e(highlightDetails[index])}</td></tr></table></td>`).join("");
  const social = (name: "instagram" | "telegram", label: string, handle: string) => `<td width="50%" ${centered}width:50%;vertical-align:top;padding:8px 4px;"><a href="${EMAIL_SOCIAL_LINKS[name]}" style="display:inline-block;text-align:center;color:#fff9e9;text-decoration:none;font-size:12px;line-height:1.9;"><img src="${assets}/${name}.png${imageRevision}" width="24" height="24" alt="" style="display:block;margin:0 auto 7px;border:0;"><span style="display:block;text-align:center;">${label}</span><span dir="ltr" style="display:block;text-align:center;color:#e1ce95;">${handle}</span></a></td>`;

  const html = `<!doctype html>
<html lang="${message.language}" dir="${direction}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light"><title>${e(message.subject)}</title>
<!--[if mso]><xml><o:OfficeDocumentSettings xmlns:o="urn:schemas-microsoft-com:office:office"><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
<style>
:root{color-scheme:light;supported-color-schemes:light}
body,table,td,p,h1,h2,a{text-align:center}
/* Gmail iOS: keep blend layers as real inline-block boxes. Gmail's
   inline text-decoration / blend compositing can create overline/underline
   seams when one of the nested layers is treated as a bare inline span. */
table{mso-table-lspace:0pt;mso-table-rspace:0pt}img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic}a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}
@media screen and (max-width:480px){.outer-pad{padding:16px 10px!important}.content-pad{padding-left:22px!important;padding-right:22px!important}.email-title{font-size:27px!important}.highlight{display:block!important;width:100%!important;padding:12px 0!important;border:0!important}.hero-content{padding:24px 18px 20px!important}.hero-title-pad{padding-top:24px!important}}
/* Signature Premium keeps its approved light reading surface in dark-mode inboxes.
   Light-only metadata opts out of inversion in supported Gmail and Apple Mail. */
${fontFaceCss}
</style></head>
<body class="email-body" style="margin:0;padding:0;width:100%;text-align:center;background-color:#efede6;color:#194936;font-family:${emailFont};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none!important;max-height:0;overflow:hidden;mso-hide:all;text-align:center;">${e(message.subtitle ?? message.title)}</div>
<table ${table} width="100%" class="outer" bgcolor="#efede6" style="width:100%;background-color:#efede6;"><tr><td class="outer-pad" ${centered}padding:32px 12px;">
<!--[if mso]><table ${table} width="600"><tr><td align="center" style="text-align:center;"><![endif]-->
<table ${table} width="100%" class="card" bgcolor="#f8f6f0" data-email-layout="signature-premium-v1" dir="${direction}" style="width:100%;max-width:600px;table-layout:fixed;font-family:${emailFont};background-color:#f8f6f0;border:1px solid #e2dcc8;border-radius:14px;border-spacing:0;overflow:hidden;">
<tr><td class="brand-header" background="${artwork}/landscape.jpg${imageRevision}" bgcolor="#102c20" ${centered}background-color:#102c20;background-image:url('${artwork}/landscape.jpg${imageRevision}');background-size:cover;background-position:center center;background-repeat:no-repeat;border-radius:13px 13px 0 0;">
<!--[if mso]><v:rect fill="true" stroke="false" style="width:600px;"><v:fill type="frame" src="${artwork}/landscape.jpg${imageRevision}" color="#102c20" aspect="atleast"/><v:textbox inset="0,0,0,0" style="mso-fit-shape-to-text:true;"><![endif]-->
<table ${table} width="100%" style="width:100%;table-layout:fixed;"><tr><td class="hero-content" ${centered}padding:25px 36px 22px;">
${brand()}
<table ${table} width="100%" style="width:100%;table-layout:fixed;"><tr><td class="hero-title-pad" ${centered}padding-top:31px;">
<h1 class="email-title" style="margin:0 0 8px;text-align:center;color:#ffffff;font-family:${emailFont};font-size:34px;font-weight:normal;line-height:1.55;">${title}</h1>
${message.subtitle ? p(message.subtitle, "font-size:16px;color:#ffffff;margin-bottom:0;") : ""}
</td></tr></table>
</td></tr><tr><td class="content-surface" bgcolor="#f8f6f0" height="14" ${centered}height:14px;background-color:#f8f6f0;border-radius:14px 14px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr></table>
<!--[if mso]></v:textbox></v:rect><![endif]-->
</td></tr>
<tr><td class="content-pad content-surface" ${centered}padding:20px 42px 4px;background-color:#f8f6f0;">
${message.greeting ? p(message.greeting, "font-size:19px;font-weight:bold;color:#202c23;margin-bottom:14px;") : ""}
${message.paragraphs.map((value) => p(value)).join("")}
</td></tr>
${metadata ? `<tr><td class="content-pad" ${centered}padding:5px 42px 0;"><table ${table} width="100%" style="width:100%;table-layout:fixed;">${metadata}</table></td></tr>` : ""}
<tr><td class="content-pad" ${centered}padding:10px 22px 22px;">
<!--[if mso]><table ${table} width="312"><tr><td align="center" style="text-align:center;"><![endif]-->
<table ${table} width="100%" style="width:100%;max-width:312px;table-layout:fixed;"><tr><td bgcolor="#153a29" ${centered}background-color:#153a29;background-image:linear-gradient(#153a29,#153a29);border-radius:13px;">
<!--[if mso]><v:roundrect href="${safeHref}" style="height:54px;v-text-anchor:middle;width:312px;" arcsize="24%" strokecolor="#b99a58" strokeweight="1px" fillcolor="#153a29"><w:anchorlock/><center dir="${direction}" style="color:#ffffff;font-family:${emailFont};font-size:17px;font-weight:normal;text-align:center;">${e(message.action.label)}</center></v:roundrect><![endif]-->
<!--[if !mso]><!--><a data-email-cta="primary" href="${safeHref}" style="display:block;padding:15px 8px;text-align:center;border:1px solid #b99a58;border-radius:13px;color:#ffffff;font-size:17px;line-height:22px;font-family:${emailFont};text-decoration:none;">${e(message.action.label)}</a><!--<![endif]-->
</td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
<tr><td class="content-pad" ${centered}padding:0 34px 22px;">
<table ${table} width="100%" class="info-panel" bgcolor="#f0ece3" style="width:100%;background-color:#f0ece3;border:1px solid #e9e3d6;border-radius:14px;"><tr><td ${centered}padding:16px 20px 5px;">
<img src="${artwork}/shield.png${imageRevision}" width="26" height="26" alt="" style="display:block;margin:0 auto 9px;"><h2 style="margin:0 0 12px;text-align:center;color:#194936;font-size:11px;line-height:1.8;">${e(message.information.title)}</h2>
${message.information.paragraphs.map((value) => p(value, "font-size:13px;line-height:1.9;color:#575c50;margin-bottom:10px;")).join("")}
</td></tr></table></td></tr>
${message.afterInformation?.length ? `<tr><td class="content-pad" ${centered}padding:0 42px 16px;">${message.afterInformation.map(value => p(value, "font-size:13px;color:#62665b;")).join("")}</td></tr>` : ""}
<tr><td ${centered}padding:0 34px;"><table ${table} width="100%" style="width:100%;border-top:1px solid #e2dcc8;"><tr><td ${centered}padding:12px 0 8px;"><table ${table} width="100%" dir="ltr" style="width:100%;table-layout:fixed;"><tr>${featureCells}</tr></table></td></tr></table></td></tr>
<tr><td class="content-surface" ${centered}background-color:#f8f6f0;font-size:0;line-height:0;"><img src="${artwork}/footer-curve.png${imageRevision}" width="600" height="58" alt="" style="display:block;margin:0 auto;width:100%;max-width:600px;height:auto;"></td></tr>
<tr><td class="footer" background="${artwork}/footer-leaves.png${imageRevision}" bgcolor="#102c20" ${centered}padding:9px 28px 25px;background-color:#102c20;background-image:url('${artwork}/footer-leaves.png${imageRevision}'),linear-gradient(#102c20,#102c20);background-size:cover,cover;background-position:center bottom,center center;border-radius:0 0 13px 13px;">
${brand(true)}
<table ${table} width="100%"><tr><td height="10" ${centered}height:10px;font-size:0;line-height:0;">&nbsp;</td></tr></table>
<table ${table} width="100%" dir="ltr" style="width:100%;max-width:280px;table-layout:fixed;"><tr>${social("instagram", "Instagram", "agromind.ir")}${social("telegram", "Telegram", "agromindir")}</tr></table>
<table ${table} width="44" style="width:44px;"><tr><td height="15" ${centered}height:15px;border-bottom:1px solid #7c744b;font-size:0;line-height:0;">&nbsp;</td></tr></table>
<p dir="ltr" style="margin:17px 0 8px;text-align:center;font-size:12px;line-height:1.8;"><a href="${origin}" style="text-align:center;color:#ffffff;text-decoration:none;">agromind.ir</a></p>
<p dir="ltr" style="margin:0;text-align:center;color:#ffffff;font-size:11px;line-height:1.8;">© ${new Date().getUTCFullYear()} AgroMind</p>
</td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
  const text = ["AgroMind", brandLine, message.title, message.subtitle, message.greeting,
    ...message.paragraphs, ...(message.metadata ?? []).map(({label,value}) => `${label}: ${value}`),
    `${message.action.label}: ${href}`, message.information.title, ...message.information.paragraphs, ...(message.afterInformation ?? []),
    highlights.join(" | "), "AgroMind", `Instagram: agromind.ir — ${EMAIL_SOCIAL_LINKS.instagram}`,
    `Telegram: agromindir — ${EMAIL_SOCIAL_LINKS.telegram}`, origin, `© ${new Date().getUTCFullYear()} AgroMind`,
  ].filter(Boolean).join("\n\n");
  return { subject: message.subject, html, text };
}
