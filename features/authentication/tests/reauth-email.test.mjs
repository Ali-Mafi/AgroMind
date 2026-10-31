import test from "node:test";
import assert from "node:assert/strict";
import { Webhook } from "standardwebhooks";
import { loadTs } from "../../weather/tests/helpers/load-ts.mjs";

const secret = "v1,whsec_" + Buffer.from("agromind-isolated-reauth-email-test").toString("base64");
const prior = {
  SUPABASE_AUTH_EMAIL_HOOK_SECRET: process.env.SUPABASE_AUTH_EMAIL_HOOK_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
};
process.env.SUPABASE_AUTH_EMAIL_HOOK_SECRET = secret;
process.env.RESEND_API_KEY = "isolated-no-send-test";
const sent = [];
const templates = loadTs("features/authentication/emails/templates.ts", {
  "../lib/redirects": { siteOrigin: () => "https://agromind.ir" },
  "@/features/settings/lib/translation": { translator: () => (text) => text },
});
const { handleAuthEmail } = loadTs("features/authentication/services/email-hook.ts", {
  "../emails/templates": templates,
  "./resend-auth": { sendAuthEmail: async (message) => { sent.push(message); } },
});
function event(type, token, language = "fa") {
  return {
    user: { email: "verified@example.test", user_metadata: { language } },
    email_data: {
      email_action_type: type,
      token_hash: "a".repeat(64),
      ...(token === undefined ? {} : { token }),
    },
  };
}
function request(body, invalidSignature = false) {
  const payload = JSON.stringify(body);
  const id = "msg_isolated_" + body.email_data.email_action_type;
  const time = new Date();
  const signature = new Webhook(secret.replace(/^v1,/, "")).sign(id, time, payload);
  return new Request("https://agromind.ir/api/auth-email", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "webhook-id": id,
      "webhook-timestamp": String(Math.floor(time.getTime() / 1000)),
      "webhook-signature": invalidSignature ? "v1,INVALID_SIGNATURE" : signature,
    },
    body: payload,
  });
}
test("F08 signed provider reauthentication emails render actual OTP safely in FA and EN", async () => {
  for (const [code, language] of [["12345678", "fa"], ["654321", "en"]]) {
    const count = sent.length;
    const response = await handleAuthEmail(request(event("reauthentication", code, language)));
    assert.equal(response.status, 200);
    assert.equal(sent.length, count + 1);
    const message = sent.at(-1);
    assert.equal(message.to, "verified@example.test");
    assert.ok(message.html.includes(code));
    assert.ok(message.text.includes(code));
    assert.ok(message.html.includes(`lang="${language}"`));
    assert.ok(message.html.includes(`dir="${language === "fa" ? "rtl" : "ltr"}"`));
    assert.ok(!message.subject.includes(code));
    assert.doesNotMatch(message.html, new RegExp(`href="[^"]*${code}`));
    assert.match(message.idempotencyKey, /^agromind-auth\/[a-f0-9]{64}$/);
  }
});
test("F08 signed unsupported OTPs and forged webhook signatures cannot dispatch mail", async () => {
  const n = sent.length;
  for (const invalid of ["12345", "12345678901", "1234x678", undefined]) {
    const response = await handleAuthEmail(request(event("reauthentication", invalid)));
    assert.equal(response.status, 400);
  }
  assert.equal((await handleAuthEmail(request(event("reauthentication", "123456"), true))).status, 401);
  assert.equal(sent.length, n);
});
test("Existing signed signup and recovery emails keep their callback links", async () => {
  for (const kind of ["signup", "recovery"]) {
    const response = await handleAuthEmail(request(event(kind)));
    assert.equal(response.status, 200);
    const msg = sent.at(-1);
    assert.match(msg.html, /token_hash=a{64}/);
    assert.match(msg.text, new RegExp("type=" + kind));
  }
});
test("Premium reauthentication template never puts the code in the email action URL", () => {
  assert.throws(() => templates.renderReauthenticationEmail("<script>", "en"), /INVALID_REAUTH_NONCE/);
  const msg = templates.renderReauthenticationEmail("1234567890", "en");
  assert.ok(msg.text.includes("1234567890"));
  assert.doesNotMatch(msg.subject, /1234567890/);
  assert.doesNotMatch(msg.html, /href="[^"]*1234567890/);
});
test.after(() => {
  for (const [key, value] of Object.entries(prior)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
