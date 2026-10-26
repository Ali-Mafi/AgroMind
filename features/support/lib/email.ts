export function supportEmail(
  number: string,
  event: string,
  language: string,
  href: string,
) {
  const fa = language === "fa";
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
  const text = `${copy[event as keyof typeof copy] ?? copy.status}\n${number}\n${href}`;
  const escape = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c]!,
    );
  return {
    subject: `${fa ? "پشتیبانی AgroMind" : "AgroMind Support"} · ${number}`,
    text,
    html: `<div lang="${fa ? "fa" : "en"}" dir="${fa ? "rtl" : "ltr"}"><p>${escape(text.split("\n")[0])}</p><p>${escape(number)}</p><a href="${escape(href)}">${fa ? "مشاهده درخواست" : "View ticket"}</a></div>`,
  };
}
