import { renderPremiumEmail } from "@/lib/email/layout";

/** Ticket bodies and internal notes are never accepted by this renderer. */
export function supportEmail(
  number: string,
  event: string,
  language: string,
  href: string,
  audience: "staff" | "user" = "user",
) {
  const fa = language === "fa";
  const staff = audience === "staff";
  const staffNew = staff && event === "created";
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
    : staff
      ? event === "reply"
        ? fa ? "پاسخ جدیدی از کاربر برای درخواست پشتیبانی ثبت شده است." : "A customer has replied to a support ticket."
        : fa ? "وضعیت درخواست پشتیبانی تغییر کرده است." : "A support ticket status has changed."
      : copy[event as keyof typeof copy] ?? copy.status;
  const heading = staffNew
    ? fa ? "درخواست جدید برای بررسی" : "New request to review"
    : staff
      ? event === "reply"
        ? fa ? "پاسخ جدید کاربر" : "New customer reply"
        : fa ? "وضعیت درخواست به‌روزرسانی شد" : "Support ticket status updated"
      : event === "created"
      ? fa ? "درخواست شما ثبت شد" : "Support ticket created"
      : event === "reply"
        ? fa ? "پاسخ جدید برای درخواست شما" : "New support reply"
        : fa ? "وضعیت درخواست به‌روزرسانی شد" : "Support ticket status updated";
  const description = staffNew
    ? fa
      ? "یک درخواست جدید در پشتیبانی ثبت شده است. برای بررسی و پاسخ، پنل مدیریت را باز کنید."
      : "A new support request is ready. Open the staff workspace to review it."
    : staff
      ? fa
        ? "برای مشاهده جزئیات و پیگیری درخواست، پنل مدیریت را باز کنید."
        : "Open the staff workspace to review the request and its latest details."
      : event === "created"
      ? fa
        ? "درخواست شما دریافت شد. وضعیت آن و پاسخ‌های بعدی را از حساب کاربری خود پیگیری کنید."
        : "Your request has been received. Follow its progress and replies from your account."
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
  const note = fa
    ? "این پیام به‌صورت خودکار ارسال شده است. برای پاسخ، از بخش پشتیبانی آگرومایند استفاده کنید."
    : "This is an automated notification. To respond, use AgroMind support.";

  // The server constructs ticket URLs; reject unintended external destinations.
  let safeHref = "https://agromind.ir/account/help";
  try {
    const parsed = new URL(href);
    if (parsed.protocol === "https:" && parsed.hostname === "agromind.ir" && !parsed.username && !parsed.password)
      safeHref = parsed.href;
  } catch {
    // Keep the known-safe fallback.
  }
  return renderPremiumEmail({
    language: fa ? "fa" : "en",
    subject: staffNew
      ? `${fa ? "درخواست پشتیبانی جدید" : "New support ticket"} · ${number}`
      : `${fa ? "پشتیبانی AgroMind" : "AgroMind Support"} · ${number}`,
    eyebrow: staffNew ? (fa ? "درخواست پشتیبانی جدید" : "NEW SUPPORT REQUEST") : (fa ? "اعلان پشتیبانی" : "SUPPORT UPDATE"),
    title: heading,
    subtitle: lead,
    paragraphs: [description],
    metadata: [{ label: numberLabel, value: number }],
    action: { label: cta, href: safeHref },
    information: { title: fa ? "اطلاعات پشتیبانی" : "Support information", paragraphs: [note] },
  });
}
