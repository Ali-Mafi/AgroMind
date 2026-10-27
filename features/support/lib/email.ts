/**
 * Email-client-friendly table layout with inline styles and no external assets.
 * Neither tickets nor message bodies are ever inserted into notifications.
 */
export function supportEmail(
  number: string,
  event: string,
  language: string,
  href: string,
  audience: "staff" | "user" = "user",
) {
  const fa = language === "fa";
  const staffNew = audience === "staff" && event === "created";
  const copy = fa
    ? {
        created: "درخواست پشتیبانی ثبت شد.",
        reply: "پیام تازه‌ای برای درخواست پشتیبانی شما ثبت شده است.",
        status: "وضعیت درخواست پشتیبانی تغییر کرده است.",
      }
    : {
        created: "Your support ticket has been created.",
        reply: "There is a new reply to your support ticket.",
        status: "Your support ticket status has changed.",
      };
  const lead = staffNew
    ? fa ? "درخواست پشتیبانی جدید ثبت شده است." : "A new support ticket has been submitted."
    : copy[event as keyof typeof copy] ?? copy.status;
  const heading = staffNew
    ? fa ? "درخواست جدید برای بررسی" : "New request to review"
    : event === "created"
      ? fa ? "درخواست شما ثبت شد" : "Your request is in"
      : event === "reply"
        ? fa ? "پاسخ جدید برای درخواست شما" : "You have a new reply"
        : fa ? "وضعیت درخواست به‌روزرسانی شد" : "Your request was updated";
  const description = staffNew
    ? fa
      ? "یک درخواست جدید در پشتیبانی ثبت شده است. برای بررسی و پاسخ، پنل مدیریت را باز کنید."
      : "A new support request is ready. Open the staff workspace to review it."
    : event === "created"
      ? fa
        ? "درخواست شما دریافت شد. وضعیت آن و پاسخ‌های بعدی را از حساب کاربری خود پیگیری کنید."
        : "We've received your request. Follow its progress and replies from your account."
      : event === "reply"
        ? fa
          ? "تیم پشتیبانی به درخواست شما پاسخ داده است. برای مشاهده پیام و ادامه گفت‌وگو وارد حساب خود شوید."
          : "Our support team has replied. Sign in to read the message and continue the conversation."
        : fa
          ? "وضعیت درخواست شما تغییر کرده است. برای مشاهده جزئیات، وارد حساب خود شوید."
          : "Your request status has changed. Sign in to view the latest details.";
  const cta = audience === "staff"
    ? fa ? "بررسی درخواست" : "Review request"
    : fa ? "مشاهده و پیگیری درخواست" : "View my request";
  const numberLabel = fa ? "شماره درخواست" : "REQUEST NUMBER";
  const brandLine = fa ? "مدیریت هوشمند کشاورزی" : "Smarter farm management";
  const note = fa
    ? "این پیام به‌صورت خودکار ارسال شده است. برای پاسخ، از بخش پشتیبانی آگرومایند استفاده کنید."
    : "This is an automated notification. To respond, use AgroMind support.";
  const direction = fa ? "rtl" : "ltr";
  const align = fa ? "right" : "left";
  const font = fa ? "Tahoma,Arial,sans-serif" : "Arial,Helvetica,sans-serif";
  const escape = (s: string) =>
    s.replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
    );

  // The server constructs ticket URLs; reject unintended external destinations.
  let safeHref = "https://agromind.ir/account/help";
  try {
    const parsed = new URL(href);
    if (parsed.protocol === "https:" && parsed.hostname === "agromind.ir" && !parsed.username && !parsed.password)
      safeHref = parsed.href;
  } catch {
    // Keep the known-safe fallback.
  }
  const safeNumber = escape(number);
  const safeUrl = escape(safeHref);
  const text = [lead, "", description, "", `${numberLabel}: ${number}`, `${cta}: ${safeHref}`, "", note].join("\n");
  const html = `<!doctype html>
<html lang="${fa ? "fa" : "en"}" dir="${direction}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><title>${escape(heading)}</title></head>
<body style="margin:0;padding:0;background-color:#f4f6ef;color:#213c2d;font-family:${font};">
<div style="display:none!important;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escape(lead)} · ${safeNumber}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;background-color:#f4f6ef;">
<tr><td align="center" style="padding:28px 12px 36px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:600px;border-collapse:separate;border-spacing:0;background-color:#ffffff;border:1px solid #dfe9da;border-radius:20px;overflow:hidden;">
<tr><td dir="${direction}" style="background-color:#194936;padding:32px 28px 26px;text-align:${align};">
<p style="margin:0;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:25px;font-weight:700;line-height:36px;" dir="ltr">&#127793; AgroMind</p>
<p style="margin:8px 0 23px;color:#d5e8cf;font-size:13px;line-height:22px;">${escape(brandLine)}</p>
<p style="margin:0;color:#e8d49a;font-size:12px;line-height:20px;font-weight:700;">${escape(staffNew ? (fa ? "درخواست پشتیبانی جدید" : "NEW SUPPORT REQUEST") : (fa ? "اعلان پشتیبانی" : "SUPPORT UPDATE"))}</p>
</td></tr>
<tr><td height="6" bgcolor="#c2a261" style="height:6px;background:#c2a261;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td height="7" bgcolor="#adc993" style="height:7px;background:#adc993;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td height="5" bgcolor="#e0edd5" style="height:5px;background:#e0edd5;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td dir="${direction}" style="padding:31px 28px 10px;text-align:${align};">
<h1 style="margin:0 0 12px;color:#194936;font-family:${font};font-size:23px;font-weight:700;line-height:1.7;">${escape(heading)}</h1>
<p style="margin:0;color:#506454;font-family:${font};font-size:15px;line-height:2;">${escape(description)}</p>
</td></tr>
<tr><td dir="${direction}" style="padding:14px 28px 0;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;background-color:#f1f7ec;border:1px solid #d9e7cf;border-radius:12px;border-collapse:separate;">
<tr><td style="padding:17px 20px;text-align:${align};">
<p style="margin:0 0 6px;color:#6b806d;font-size:12px;line-height:18px;font-weight:700;">${escape(numberLabel)}</p>
<p dir="ltr" style="margin:0;color:#174832;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;line-height:28px;text-align:${align};">${safeNumber}</p>
</td></tr></table></td></tr>
<tr><td dir="${direction}" style="padding:26px 28px 32px;text-align:${align};">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:separate;"><tr><td bgcolor="#246545" style="background-color:#246545;border-radius:10px;text-align:center;">
<a href="${safeUrl}" style="display:inline-block;padding:14px 23px;border-radius:10px;color:#ffffff;font-family:${font};font-size:14px;font-weight:700;line-height:22px;text-decoration:none;">${escape(cta)}</a>
</td></tr></table>
</td></tr>
<tr><td dir="${direction}" style="padding:22px 28px 27px;background-color:#fafbf7;border-top:1px solid #e3eadf;text-align:${align};">
<p style="margin:0 0 10px;color:#6c7d71;font-size:12px;line-height:23px;">${escape(note)}</p>
<p style="margin:0;color:#37674b;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;" dir="ltr">agromind.ir</p>
</td></tr></table>
<p style="margin:18px 0 0;color:#879385;font-size:12px;line-height:22px;text-align:center;">${escape(fa ? "آگرومایند | همراه مدیریت هوشمند مزرعه" : "AgroMind | Your farm, better managed")}</p>
</td></tr></table></body></html>`;

  return {
    subject: staffNew
      ? `${fa ? "درخواست پشتیبانی جدید" : "New support ticket"} · ${number}`
      : `${fa ? "پشتیبانی AgroMind" : "AgroMind Support"} · ${number}`,
    text,
    html,
  };
}
