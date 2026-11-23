import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import test from "node:test";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const app = "http://127.0.0.1:3188";
const user = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "mfa-browser@example.test",
  email_confirmed_at: "2026-11-20T00:00:00Z",
  factors: [{ id: "fixture", status: "verified", factor_type: "totp" }],
};

async function newPage(t, options) {
  const executablePath = process.env.MFA_TEST_CHROMIUM_PATH;
  const browser = await chromium.launch(executablePath ? {
    executablePath,
    args: ["--single-process", "--no-zygote", "--disable-gpu"],
  } : {});
  t.after(() => browser.close());
  const page = await browser.newPage({
    viewport: { width: 375, height: 812 },
    serviceWorkers: "block",
    ...options,
  });
  await page.route((url) => url.origin !== app, (route) => route.abort("blockedbyclient"));
  page.setDefaultTimeout(10_000);
  return page;
}

function fixtureSession(method) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return {
    access_token: [
      encode({ alg: "HS256", typ: "JWT" }),
      encode({
        sub: user.id, aal: "aal1", session_id: user.id, exp, amr: [{ method }],
      }),
      "Zml4dHVyZQ",
    ].join("."),
    refresh_token: "fixture-only",
    expires_at: exp,
    expires_in: 3600,
    token_type: "bearer",
    user,
  };
}

test("MFA cancellation works from either button, including after client navigation", { timeout: 90_000 }, async (t) => {
  // Only loopback services are used. The fixture has no production credentials.
  const provider = createServer((request, response) => {
    const path = new URL(request.url, app).pathname;
    const data = {
      "/auth/v1/token": fixtureSession("password"),
      "/auth/v1/user": user,
      "/rest/v1/rpc/get_current_session": { created_at: user.email_confirmed_at },
    }[path];
    response.writeHead(data ? 200 : 404, { "content-type": "application/json" });
    response.end(JSON.stringify(data ?? {}));
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
      NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${provider.address().port}`,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "mfa-browser-fixture",
      NEXT_PUBLIC_SITE_URL: app,
      SUPABASE_RECOVERY_CODES_ENABLED: "false",
      RESEND_API_KEY: "",
    },
  });
  t.after(() => server.kill());
  for await (const output of server.stdout.iterator({ destroyOnReturn: false })) {
    if (String(output).includes("Ready")) break;
  }
  server.stdout.resume();

  for (const action of ["back", "cancel"]) {
    await t.test(action, async (t) => {
      const page = await newPage(t, { hasTouch: true });
      if (action === "back") {
        // Match browsers that support AbortController but omit AbortSignal.timeout.
        await page.addInitScript(() => Reflect.deleteProperty(AbortSignal, "timeout"));
      }
      await page.goto(app + "/privacy", { waitUntil: "domcontentloaded" });
      await page.goto(app + "/sign-in", { waitUntil: "domcontentloaded" });
      await page.evaluate(() => { window.mfaTestDocument = true; });
      await page.locator("#sign-in-identifier").fill(user.email);
      await page.locator("#sign-in-password").fill("fixture-password");
      await page.locator("form").filter({ has: page.locator("#sign-in-password") })
        .locator('button[type="submit"]').click();
      await page.waitForURL(`${app}/mfa?next=*`, { waitUntil: "domcontentloaded" });
      assert.equal(await page.evaluate(() => window.mfaTestDocument), true);

      const back = page.locator('button[form="mfa-cancel"]');
      const cancel = page.locator('#mfa-cancel button[type="submit"]');
      const button = action === "back" ? back : cancel;
      assert.equal(await button.evaluate((element) => element.form.id), "mfa-cancel");
      assert.equal(await page.locator("#mfa-code").inputValue(), "");
      const challengeUrl = page.url();
      const endpoint = app + "/mfa/cancel";
      let failedRequests = 0;
      await page.route(endpoint, async (route) => {
        failedRequests += 1;
        if (failedRequests === 1) await route.fulfill({ status: 403, body: "" });
        else await route.abort("failed");
      });
      for (let failures = 1; failures <= 2; failures++) {
        await button.click();
        await page.getByText("Could not cancel. Please try again.", { exact: true }).waitFor();
        assert.equal(page.url(), challengeUrl);
        assert.equal(failedRequests, failures);
        assert.equal(await page.locator("#mfa-code").isVisible(), true);
      }
      await page.unroute(endpoint);

      const post = page.waitForResponse(endpoint);
      const historyLength = await page.evaluate(() => history.length);
      await button.click();
      const response = await post;
      assert.equal(response.request().method(), "POST");
      assert.equal((await response.request().allHeaders()).origin, app);
      assert.deepEqual([...new URLSearchParams(response.request().postData()).keys()], ["attempt"]);
      assert.equal(response.status(), 204);
      await page.waitForURL(app + "/sign-in", { waitUntil: "domcontentloaded" });
      await page.locator("#sign-in-identifier").waitFor();
      assert.equal(await page.evaluate(() => history.length), historyLength);
      await page.goBack({ waitUntil: "domcontentloaded" });
      assert.doesNotMatch(page.url(), /\/mfa(?:[/?]|$)/);
      await page.goForward({ waitUntil: "domcontentloaded" });
      await page.locator("#sign-in-identifier").waitFor();
      assert.equal(page.url(), app + "/sign-in");
    });
  }

  await t.test("Persian recovery with the native form", async (t) => {
    const page = await newPage(t, { javaScriptEnabled: false });
    await page.context().addCookies([
      {
        url: app, name: "sb-127-auth-token",
        value: "base64-" + Buffer.from(JSON.stringify(fixtureSession("otp"))).toString("base64url"),
      },
      {
        url: app, name: "agromind_display_v1",
        value: encodeURIComponent(JSON.stringify({ version: 1, country: "IR", language: "fa", regionConfirmed: true })),
      },
    ]);
    await page.goto(app + "/mfa?next=%2Freset-password");
    assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
    const recoveryCancel = page.getByRole("button", { name: "لغو بازنشانی رمز عبور" });
    await recoveryCancel.click();
    await page.waitForURL(app + "/sign-in");
    await page.locator("#sign-in-identifier").waitFor();
  });
});
