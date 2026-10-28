import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { loadTs } from "../../weather/tests/helpers/load-ts.mjs";
const { renderAuthEmail } = loadTs("features/authentication/emails/templates.ts");
const { renderFarmInvitationEmail } = loadTs("features/collaboration/emails/templates.ts");
const { supportEmail } = loadTs("features/support/lib/email.ts");
const fixtureToken = "b".repeat(64);
const ticketUrl = "https://agromind.ir/account/help/tickets/42";

function emails(language) {
  return [
    ...["signup", "recovery"].map((kind) => renderAuthEmail(kind, fixtureToken, language)),
    renderFarmInvitationEmail({ href: "https://agromind.ir/invite/fixture", farmName: "مزرعه نمونه", role: "manager", language }),
    ...["user", "staff"].flatMap((audience) => ["created", "reply", "status"].map((event) => supportEmail("AM-00000042", event, language, ticketUrl, audience))),
  ];
}

test("all email families reuse the same text-only content boundary", () => {
  const calls = [];
  const shared = { renderPremiumEmail: (input) => { calls.push(input); return { html: "shared", text: "shared", subject: input.subject }; } };
  loadTs("features/authentication/emails/templates.ts", { "@/lib/email/layout": shared }).renderAuthEmail("signup", fixtureToken, "fa");
  loadTs("features/collaboration/emails/templates.ts", { "@/lib/email/layout": shared }).renderFarmInvitationEmail({href:ticketUrl,farmName:"test",role:"viewer",language:"en"});
  loadTs("features/support/lib/email.ts", { "@/lib/email/layout": shared }).supportEmail("AM-42","reply","en",ticketUrl);
  assert.equal(calls.length, 3);
  assert.ok(calls.every((input) => input.paragraphs.length && input.information.paragraphs.length));
});

test("every section has explicit symmetric alignment, directions, assets and text fallbacks", () => {
  for (const language of ["fa", "en"]) for (const email of emails(language)) {
    assert.match(email.html, /data-email-layout="signature-premium-v1"/);
    assert.match(email.html, new RegExp(`<html lang="${language}" dir="${language === "fa" ? "rtl" : "ltr"}"`));
    assert.match(email.html, /max-width:600px/);
    for (const cell of email.html.matchAll(/<td\b[^>]*>/g)) {
      assert.match(cell[0], /align="center"/);
      assert.match(cell[0], /text-align:center/);
    }
    for (const table of email.html.matchAll(/<table\b[^>]*>/g)) assert.match(table[0], /align="center"/);
    assert.doesNotMatch(email.html, /text-align:\s*(?:right|left)|align="(?:right|left)"|display:\s*(?:flex|grid)/);
    assert.match(email.html, /<v:roundrect/);
    assert.match(email.html, /prefers-color-scheme:dark/);
    assert.match(email.html, /max-width:480px/);
    const cta = [...email.html.matchAll(/<a\b[^>]*data-email-cta="primary"[^>]*>/g)];
    assert.equal(cta.length, 1);
    assert.match(email.html, /background="https:\/\/agromind.ir\/email\/signature-v2\/landscape.jpg\?v=20261028r2"/);
    assert.match(email.html, /<v:fill[^>]+landscape.jpg/);
    assert.match(email.html, /bgcolor="#102c20"/);
    for (const image of email.html.matchAll(/src="https:\/\/agromind.ir(\/email\/[^\"]+)"/g)) {
      const url = new URL(image[1], "https://agromind.ir");
      assert.equal(url.searchParams.get("v"), "20261028r2");
      assert.ok(existsSync(`public${url.pathname}`), url.pathname);
    }
    for (const required of ["signature-leaf.png", "instagram.png", "telegram.png", "shield.png", "footer-curve.png"]) assert.ok(email.html.includes(`${required}?v=20261028r2`), required);
    assert.match(email.html, /https:\/\/www.instagram.com\/agromind.ir\//);
    assert.match(email.html, /https:\/\/t.me\/agromindir/);
    assert.match(email.text, /Instagram: agromind.ir/);
    assert.match(email.text, /Telegram: agromindir/);
    assert.doesNotMatch(email.html, /<script|<iframe|data:image|@import|@font-face|onerror=/);
    const withoutImages = email.html.replace(/<img\b[^>]*>/g, "");
    assert.match(withoutImages, /<h1/);
    assert.match(withoutImages, /data-email-cta="primary"/);
    assert.match(withoutImages, /AgroMind/);
    assert.ok(email.text.length > 200);
  }
});

test("approved Persian verification wording states confirmed one-hour lifetime", () => {
  const email = renderAuthEmail("signup", fixtureToken, "fa");
  assert.equal(email.subject, "تأیید نشانی ایمیل | AgroMind");
  for (const line of ["تأیید نشانی ایمیل", "یک گام تا شروع مسیر هوشمند کشاورزی", "کاربر گرامی،", "از ثبت‌نام شما در AgroMind سپاسگزاریم.", "برای فعال‌سازی حساب کاربری و تکمیل فرایند ثبت‌نام، لطفاً روی دکمه زیر کلیک کنید و نشانی ایمیل خود را تأیید کنید.", "اطلاع‌رسانی امنیتی", "این لینک به دلایل امنیتی تنها یک‌بار قابل استفاده است و تا ۱ ساعت اعتبار دارد.", "اگر این درخواست از طرف شما نبوده است، نیازی به اقدامی نیست و می‌توانید این ایمیل را نادیده بگیرید.", "کشاورزی پایدار | تصمیم‌های هوشمند | همکاری مؤثر"]) assert.ok(email.text.includes(line), line);
  assert.doesNotMatch(email.text, /۲۴ ساعت|24 hours/);
  assert.match(renderAuthEmail("signup", fixtureToken, "en").text, /valid for one hour/);
  assert.match(readFileSync("supabase/config.toml", "utf8"), /otp_expiry = 3600/);
});

test("auth actions preserve allowlisted callback, validated hash and action type", () => {
  for (const kind of ["signup", "recovery"]) {
    const html = renderAuthEmail(kind, fixtureToken, "en").html;
    const href = html.match(/data-email-cta="primary" href="([^"]+)"/)[1].replaceAll("&amp;", "&");
    const url = new URL(href);
    assert.equal(url.origin, "https://agromind.ir");
    assert.equal(url.pathname, "/auth/callback");
    assert.equal(url.searchParams.get("type"), kind);
    assert.equal(url.searchParams.get("token_hash"), fixtureToken);
  }
  assert.throws(() => renderAuthEmail("signup", '<img src=x>', "fa"));
});

test("escaping, destination safety and staff copy never introduce ticket bodies or internal notes", () => {
  const injection = '<img src=x onerror="alert(1)">';
  const invite = renderFarmInvitationEmail({href:"https://agromind.ir/invite/fixture?a=1&b=2",farmName:injection,role:"viewer",language:"en"});
  assert.ok(invite.html.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"));
  assert.doesNotMatch(invite.html, /<img src=x/);
  assert.match(invite.html, /fixture\?a=1&amp;b=2/);
  assert.throws(() => renderFarmInvitationEmail({href:"javascript:alert(1)",farmName:"Farm",role:"viewer",language:"en"}));
  for (const href of ["javascript:alert(1)","https://evil.test/ticket", "https://agromind.ir@evil.test/ticket"]) {
    const email = supportEmail(injection,"reply","en",href);
    assert.match(email.html, /data-email-cta="primary" href="https:\/\/agromind.ir\/account\/help"/);
    assert.doesNotMatch(email.html, /<img src=x/);
  }
  for (const event of ["created", "reply", "status"]) {
    const staff = supportEmail("AM-42",event,"en","https://agromind.ir/admin/support?ticket=42","staff");
    assert.match(staff.text, /staff workspace/);
    assert.doesNotMatch(staff.text, /Our support team has replied|We've received|internal note|ticket body/i);
  }
});
