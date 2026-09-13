import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { Webhook } from "standardwebhooks";
import { loadTs } from "../../weather/tests/helpers/load-ts.mjs";
const { renderAuthEmail } = loadTs(
  "features/authentication/emails/templates.ts",
);
const testSecret = randomBytes(32).toString("base64");
const signer = new Webhook(testSecret);
const payload = {
  user: { email: "test@example.test", user_metadata: { language: "fa" } },
  email_data: {
    token_hash: "a".repeat(64),
    email_action_type: "signup",
    redirect_to: "https://untrusted.test",
  },
};
function request(input = payload, age = 0) {
  const body = JSON.stringify(input);
  const timestamp = new Date(Date.now() + age);
  return new Request("https://agromind.ir/api/auth-email", {
    method: "POST",
    body,
    headers: {
      "webhook-id": "evt-fixture",
      "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
      "webhook-signature": signer.sign("evt-fixture", timestamp, body),
      "Content-Type": "application/json",
    },
  });
}
test("both email templates contain an explicit plain text alternative and one branded CTA", () => {
  for (const kind of ["signup", "recovery"])
    for (const language of ["en", "fa"]) {
      const email = renderAuthEmail(kind, "b".repeat(64), language);
      assert.match(email.text, /AgroMind/);
      assert.match(email.text, /https:\/\/agromind.ir\/auth\/callback/);
      assert.equal((email.html.match(/<a /g) ?? []).length, 1);
      assert.match(
        email.html,
        new RegExp('dir="' + (language === "fa" ? "rtl" : "ltr") + '"'),
      );
      assert.match(email.html, /type=(signup|recovery)/);
      assert.doesNotMatch(email.html, /<script|tracking|pixel|unsubscribe/);
    }
});
test("signed email hooks validate timestamp and body, send only supported events and reuse idempotency keys", async (t) => {
  const savedSecret = process.env.SUPABASE_AUTH_EMAIL_HOOK_SECRET,
    savedKey = process.env.RESEND_API_KEY;
  process.env.SUPABASE_AUTH_EMAIL_HOOK_SECRET = "v1,whsec_" + testSecret;
  process.env.RESEND_API_KEY = "fixture-not-a-real-resend-key";
  t.after(() => {
    if (savedSecret === undefined)
      delete process.env.SUPABASE_AUTH_EMAIL_HOOK_SECRET;
    else process.env.SUPABASE_AUTH_EMAIL_HOOK_SECRET = savedSecret;
    if (savedKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = savedKey;
  });
  const emails = [];
  const { handleAuthEmail } = loadTs(
    "features/authentication/services/email-hook.ts",
    { "./resend-auth": { sendAuthEmail: async (value) => emails.push(value) } },
  );
  assert.equal(
    (
      await handleAuthEmail(
        new Request("https://agromind.ir/api/auth-email", {
          method: "POST",
          body: "{}",
        }),
      )
    ).status,
    401,
  );
  assert.equal((await handleAuthEmail(request(payload, -600000))).status, 401);
  const tampered = request();
  const invalid = new Request(tampered.url, {
    method: "POST",
    headers: tampered.headers,
    body: JSON.stringify({
      ...payload,
      user: { email: "attacker@example.test" },
    }),
  });
  assert.equal((await handleAuthEmail(invalid)).status, 401);
  assert.equal(emails.length, 0);
  assert.equal((await handleAuthEmail(request())).status, 200);
  assert.equal((await handleAuthEmail(request())).status, 200);
  assert.equal(emails[0].idempotencyKey, emails[1].idempotencyKey);
  assert.equal(emails[0].to, "test@example.test");
  assert.ok(emails[0].subject.includes("تأیید"));
  assert.doesNotMatch(emails[0].text, /untrusted/);
  assert.equal(
    (
      await handleAuthEmail(
        request({
          ...payload,
          email_data: { ...payload.email_data, email_action_type: "invite" },
        }),
      )
    ).status,
    400,
  );
  const failed = loadTs("features/authentication/services/email-hook.ts", {
    "./resend-auth": {
      sendAuthEmail: async () => {
        throw new Error("sensitive provider detail");
      },
    },
  });
  const response = await failed.handleAuthEmail(request());
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /sensitive/);
  const huge = request({ ...payload, extra: "x".repeat(70000) });
  assert.equal((await handleAuthEmail(huge)).status, 401);
});
