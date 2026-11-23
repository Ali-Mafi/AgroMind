import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import test from "node:test";
import { chromium } from "playwright";
import { loadTs } from "../features/weather/tests/helpers/load-ts.mjs";

const require = createRequire(import.meta.url);
const app = "http://127.0.0.1:3189";
const mailOrigin = "https://agromind.ir";
const hookSecret = "browser-fixture-hook-secret";
const fixtureEmail = "recovery-browser@example.test";
const factorId = randomUUID();
const user = {
  id: randomUUID(), email: fixtureEmail, factors: [],
  email_confirmed_at: "2026-11-20T00:00:00Z",
};
const authCookie = "sb-127-auth-token";
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const expectedPassword = "Fixture#Password2026";

function session(account, aal, id = randomUUID()) {
  const exp = Math.floor(Date.now() / 1000) + 1800;
  return {
    access_token: [encode({ alg: "HS256", typ: "JWT" }),
      encode({ sub: account.id, aal, session_id: id, exp, amr: [{ method: aal === "aal2" ? "totp" : "otp" }] }),
      "Zml4dHVyZQ"].join("."),
    refresh_token: "fixture-" + id,
    expires_at: exp,
    expires_in: 1800,
    token_type: "bearer",
    user: account,
  };
}

async function launch(t) {
  const executablePath = process.env.MFA_TEST_CHROMIUM_PATH;
  const browser = await chromium.launch(executablePath ? {
    executablePath,
    args: ["--single-process", "--no-zygote", "--disable-gpu"],
  } : {});
  t.after(() => browser.close());
  return browser;
}

async function openPage(t, account, language, aal = "aal1") {
  const browser = await launch(t);
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, serviceWorkers: "block" });
  await context.addCookies([
    ...(account ? [{ url: app, name: authCookie, value: "base64-" + encode(session(account, aal)) }] : []),
    {
      url: app, name: "agromind_display_v1",
      value: encodeURIComponent(JSON.stringify({ version: 1, country: "IR", language, regionConfirmed: true })),
    },
  ]);
  await context.route((url) => url.origin !== app, (route) => route.abort("blockedbyclient"));
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);
  return page;
}

test("built recovery pages enforce authorization and preserve mobile account switching", { timeout: 90_000 }, async (t) => {
  const grants = new Map();
  const emails = new Map();
  const accounts = new Map([[user.id, user]]);
  const calls = [];
  const provider = createServer(async (request, response) => {
    const path = new URL(request.url, app).pathname;
    const method = request.method;
    const [payload] = (request.headers.authorization ?? "").split(".").slice(1);
    const claims = payload ? JSON.parse(Buffer.from(payload, "base64url").toString()) : null;
    const account = accounts.get(claims?.sub);
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const data = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
    const send = (code, value) => {
      response.writeHead(code, { "content-type": "application/json" });
      response.end(JSON.stringify(value));
    };

    if (path === "/auth/v1/verify") {
      calls.push("verify");
      const target = emails.get(data.token_hash);
      if (!target || data.type !== "recovery")
        return send(403, { code: "otp_expired", message: "Expired fixture" });
      emails.delete(data.token_hash);
      return send(200, session(target, "aal1"));
    }
    if (path === "/rest/v1/rpc/issue_password_recovery") {
      assert.equal(request.headers.apikey, "recovery-browser-service-fixture");
      grants.set(data.p_hash, { userId: data.p_user, sessionId: data.p_session });
      return send(200, true);
    }
    if (path === "/rest/v1/rpc/has_password_recovery" || path === "/rest/v1/rpc/consume_password_recovery") {
      const grant = grants.get(data.p_hash);
      const allowed = grant?.userId === data.p_user && grant?.sessionId === data.p_session;
      if (path.endsWith("/consume_password_recovery") && allowed) {
        calls.push("consume");
        grants.delete(data.p_hash);
      }
      return send(200, Boolean(allowed));
    }
    if (path === "/auth/v1/user" && account) {
      if (method === "PUT") {
        calls.push("update");
        assert.equal(data.password, expectedPassword);
      }
      return send(200, account);
    }
    if (path === "/auth/v1/factors/" + factorId + "/challenge" && account)
      return send(200, { id: randomUUID(), expires_at: Math.floor(Date.now() / 1000) + 60 });
    if (path === "/auth/v1/factors/" + factorId + "/verify" && account) {
      calls.push("totp");
      if (data.code !== "123456")
        return send(422, { code: "mfa_verification_failed", message: "Incorrect fixture" });
      return send(200, session(account, "aal2", claims.session_id));
    }
    if (path === "/auth/v1/logout") {
      calls.push("logout");
      return send(200, {});
    }
    if (path === "/rest/v1/rpc/get_current_session")
      return send(200, account ? { created_at: user.email_confirmed_at } : null);
    return send(404, { message: "Unconfigured fixture" });
  });
  provider.listen(0, "127.0.0.1");
  t.after(() => provider.close());
  await once(provider, "listening");

  const server = spawn(process.execPath, [
    require.resolve("next/dist/bin/next"), "start",
    "--hostname", "127.0.0.1", "--port", new URL(app).port,
  ], {
    stdio: ["ignore", "pipe", "inherit"],
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:" + provider.address().port,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "recovery-browser-publishable-fixture",
      SUPABASE_SERVICE_ROLE_KEY: "recovery-browser-service-fixture",
      SUPABASE_AUTH_EMAIL_HOOK_SECRET: hookSecret,
      NEXT_PUBLIC_SITE_URL: mailOrigin,
    },
  });
  t.after(() => server.kill());
  for await (const output of server.stdout.iterator({ destroyOnReturn: false })) {
    if (String(output).includes("Ready")) break;
  }
  server.stdout.resume();

  process.env.SUPABASE_AUTH_EMAIL_HOOK_SECRET = hookSecret;
  process.env.NEXT_PUBLIC_SITE_URL = mailOrigin;
  const { recoveryRequestUrl, attestRecoveryEmail } = loadTs(
    "features/authentication/services/recovery-email-proof.ts",
  );
  async function beginRecovery(page, account) {
    accounts.set(account.id, account);
    const hash = randomUUID().replaceAll("-", "");
    emails.set(hash, account);
    const proof = attestRecoveryEmail(recoveryRequestUrl(account.email), account.email, account.id, hash);
    const callback = await page.request.get(
      app + "/auth/callback?type=recovery&token_hash=" + hash + "&proof=" + proof,
      { maxRedirects: 0 },
    );
    assert.equal(callback.status(), 307);
    const destination = new URL(callback.headers().location);
    assert.equal(destination.origin, mailOrigin);
    const linkPath = destination.pathname + destination.search;
    await page.goto(app + linkPath);
    assert.equal(await page.locator("#reset-password").count(), 0);
    assert.ok(emails.has(hash), "loading the link did not redeem its token");
    await page.locator("form").filter({ has: page.locator('input[name="recovery_proof"]') })
      .locator('button[type="submit"]').click();
    await page.waitForURL(app + "/reset-password");
    await page.locator("#reset-password").waitFor();
    return linkPath;
  }

  await t.test("ordinary sessions and forged link navigation never render a password form", async (t) => {
    for (const aal of ["aal1", "aal2"]) {
      const page = await openPage(t, user, "en", aal);
      for (const search of ["", "?type=recovery&token_hash=" + "a".repeat(64)]) {
        await page.goto(app + "/reset-password" + search);
        assert.equal(await page.locator("#reset-password").count(), 0);
        assert.equal(await page.locator("#forgot-email").isVisible(), true);
      }
      await page.context().close();
    }
    assert.deepEqual(calls, []);
  });

  await t.test("Persian MFA recovery verifies fresh TOTP and rejects a used email link", async (t) => {
    const page = await openPage(t, null, "fa");
    const account = { ...user, id: randomUUID(), factors: [{ id: factorId, status: "verified", factor_type: "totp" }] };
    const linkPath = await beginRecovery(page, account);
    assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
    const complete = page.locator("form").filter({ has: page.locator("#reset-password") });
    const submit = complete.locator('button[type="submit"]');
    await page.locator("#reset-password").fill(expectedPassword);
    await page.locator("#reset-confirmPassword").fill(expectedPassword);
    await submit.click();
    await complete.locator('[role="alert"]').waitFor();
    assert.deepEqual(calls, ["verify"]);

    await page.locator("#reset-code").fill("123456");
    await page.locator("#reset-confirmPassword").press("Enter");
    await page.waitForURL(app + "/sign-in?status=password-updated");
    assert.deepEqual(calls, ["verify", "totp", "consume", "update", "logout"]);
    await page.goto(app + linkPath);
    await page.locator("form").filter({ has: page.locator('input[name="recovery_proof"]') })
      .locator('button[type="submit"]').click();
    await page.locator('[role="alert"]').waitFor();
    assert.equal(await page.locator("#reset-password").count(), 0);
    assert.equal(calls.filter((call) => call === "update").length, 1);
    await page.context().close();
  });

  await t.test("verified recovery cancellation returns to sign-in and back does not restore the form", async (t) => {
    const page = await openPage(t, null, "en");
    await beginRecovery(page, user);
    assert.equal(await page.locator("#reset-code").count(), 0);
    const back = page.locator('button[form="recovery-cancel"]');
    assert.equal(await back.evaluate((button) => button.form.id), "recovery-cancel");
    await back.click();
    await page.waitForURL(app + "/sign-in");
    await page.goBack({ waitUntil: "domcontentloaded" });
    assert.equal(await page.locator("#reset-password").count(), 0);
    await page.goto(app + "/reset-password");
    assert.equal(await page.locator("#reset-password").count(), 0);
    assert.equal(await page.locator("#forgot-email").isVisible(), true);
    await page.context().close();
  });
});
