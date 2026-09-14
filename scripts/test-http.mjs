import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const port = 3187;
const base = "http://127.0.0.1:" + port;

// Only public pages and unauthenticated redirects are exercised. These inert
// local settings never point at a hosted project or send a real email.
const server = spawn(
  process.execPath,
  [
    require.resolve("next/dist/bin/next"),
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-http-check-only",
      NEXT_PUBLIC_SITE_URL: base,
      RESEND_API_KEY: "",
      SUPABASE_AUTH_EMAIL_HOOK_SECRET: "",
    },
  },
);

try {
  await new Promise((resolve, reject) => {
    const deadline = setTimeout(
      () => reject(new Error("Local server did not start")),
      30000,
    );
    server.stdout.on("data", (data) => {
      if (data.toString().includes("Ready")) {
        clearTimeout(deadline);
        resolve();
      }
    });
    server.stderr.resume();
    server.once("error", () => {
      clearTimeout(deadline);
      reject(new Error("Local server could not start"));
    });
    server.once("exit", () => {
      clearTimeout(deadline);
      reject(new Error("Local server exited"));
    });
  });

  for (const path of [
    "/dashboard",
    "/farms",
    "/irrigation",
    "/account/profile",
    "/settings",
    "/onboarding",
  ]) {
    const response = await fetch(base + path, { redirect: "manual" });
    assert.equal(response.status, 307, path);
    assert.equal(
      new URL(response.headers.get("location"), base).pathname,
      "/sign-in",
    );
    assert.match(response.headers.get("cache-control"), /no-store/);
    console.log("PASS protected route", path);
  }

  for (const path of [
    "/sign-up",
    "/sign-in",
    "/forgot-password",
    "/reset-password",
  ]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), /<form/);
    assert.match(response.headers.get("cache-control"), /no-store/);
    console.log("PASS public auth form", path);
  }

  // Verification is intentionally not a generic public email form anymore.
  // Without a pending signup cookie it should only explain how to start signup,
  // preventing arbitrary verification resend requests from this route.
  {
    const path = "/verify-email?status=invalid";
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.doesNotMatch(html, /<form/);
    assert.match(html, /Verification is available after you create an account/);
    assert.match(html, /Create an account/);
    assert.match(response.headers.get("cache-control"), /no-store/);
    console.log("PASS restricted verification entry", path);
  }

  for (const [path, next] of [
    ["/login", "/sign-in"],
    ["/signup", "/sign-up"],
  ]) {
    const response = await fetch(base + path, { redirect: "manual" });
    assert.ok([307, 308].includes(response.status));
    assert.equal(
      new URL(response.headers.get("location"), base).pathname,
      next,
    );
    console.log("PASS compatible redirect", path);
  }
} finally {
  server.kill("SIGTERM");
}
