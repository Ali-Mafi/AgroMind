import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";

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

  {
    const response = await fetch(base + "/");
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /<h1[^>]*>/);
    assert.doesNotMatch(html, /style="opacity:0;transform:translateY\(16px\)"/);
    assert.doesNotMatch(html, /agromind-logo\.png/);
    assert.match(html, /\/logo\/agromind-mark-132-v1\.webp/);
    console.log("PASS landing content is visible in initial server HTML");
    const logo = await fetch(base + "/logo/agromind-mark-132-v1.webp");
    assert.equal(logo.status, 200);
    assert.match(logo.headers.get("content-type"), /image\/webp/);
    const size = (await logo.arrayBuffer()).byteLength;
    assert.ok(size < 20_000);
    console.log(`PASS public retina logo: ${size} bytes`);
  }

  // Assert server-rendered locale before any JavaScript, then a separate user's
  // English/default request. Personalized HTML must never enter a shared cache.
  for (const path of ["/", "/sign-in", "/sign-up"]) {
    for (const language of ["fa", "en", null]) {
      const cookie = language ? "agromind_display_v1=" + encodeURIComponent(JSON.stringify({
        version: 1, country: language === "fa" ? "IR" : "US", language, regionConfirmed: true,
      })) : "";
      const response = await fetch(base + path, { headers: { cookie } });
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.match(html, language === "fa" ? /<html[^>]*lang="fa"[^>]*dir="rtl"/ : /<html[^>]*lang="en"[^>]*dir="ltr"/);
      const heading = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "";
      assert.ok(heading.length > 0);
      assert.equal(/[\u0600-\u06ff]/.test(heading), language === "fa", `${path}: ${language} heading`);
      assert.match(response.headers.get("cache-control"), /private/);
      assert.match(response.headers.get("cache-control"), /no-store/);
      console.log("PASS initial locale and cache isolation", path, language ?? "default");
    }
  }

  for (const image of [
    "header-field-v2", "header-orchard-v2", "garden-tree-v2",
    "crop-corn", "crop-wheat", "crop-rice", "crop-tomato", "crop-field",
  ]) {
    const path = `/images/dashboard/${image}.webp`;
    const response = await fetch(base + path, { redirect: "manual" });
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type"), /image\/webp/, path);
    const imageBytes = Buffer.from(await response.arrayBuffer());
    assert.equal(imageBytes.subarray(0, 4).toString(), "RIFF", path);
    assert.ok(imageBytes.length > 40_000, path);
    console.log("PASS public dashboard image", path);
  }

  // Exercise the same hashed sources used by next/image, including mobile
  // retina sizes. Neither optimization nor assets may require a user session.
  const media = readdirSync(".next/static/media");
  for (const image of ["header-field-v2", "header-orchard-v2", "garden-tree-v2", "crop-corn"]) {
    const filename = media.find(name => name.startsWith(image + ".") && name.endsWith(".webp"));
    assert.ok(filename, image);
    const source = `/_next/static/media/${filename}`;
    const originalSize = statSync(`.next/static/media/${filename}`).size;
    for (const width of [640, 1200]) {
      const response = await fetch(`${base}/_next/image?url=${encodeURIComponent(source)}&w=${width}&q=75`, {
        headers: { Accept: "image/webp" }, redirect: "manual",
      });
      assert.equal(response.status, 200, source);
      assert.match(response.headers.get("content-type"), /image\/webp/);
      assert.match(response.headers.get("cache-control"), /immutable/);
      const bytes = (await response.arrayBuffer()).byteLength;
      assert.ok(bytes < originalSize, `${image}: optimized ${bytes} vs original ${originalSize}`);
      console.log(`PASS optimized ${image} ${width}w: ${bytes}/${originalSize} bytes, immutable cache`);
    }
  }

  for (const path of [
    "/dashboard",
    "/assistant",
    "/account",
    "/farms/example",
    "/weather",
    "/account/help",
    "/account/about",
    "/farms/example/sensors",
    "/farms/example/insights",
    "/farms",
    "/irrigation",
    "/account/profile",
    "/account/security",
    "/mfa",
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
    const html = await response.text();
    assert.match(html, /<form/);
    const head = html.match(/<head>[\s\S]*?<\/head>/)?.[0] ?? "";
    assert.match(head, /name="apple-mobile-web-app-status-bar-style" content="default"/);
    assert.match(head, /name="viewport" content="[^"]*viewport-fit=cover/);
    if (path === "/sign-in") {
      assert.doesNotMatch(html, /href="\/verify-email/);
      assert.match(html, /href="\/forgot-password"/);
    }
    assert.match(response.headers.get("cache-control"), /no-store/);
    console.log("PASS public auth form", path);
  }

  // Cookie expiry and another browser must not strand an unverified account.
  {
    const path = "/verify-email?status=invalid";
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, /<form/);
    assert.match(html, /name="email"/);
    assert.match(html, /Resend verification email/);
    assert.match(response.headers.get("cache-control"), /no-store/);
    console.log("PASS verification resend without cookies", path);
  }

  {
    const response = await fetch(base + "/verify-email?status=pending", {
      headers: { cookie: "agromind_pending_email=farmer%40example.test; agromind_pending_username=test_farmer; agromind_pending_verification=local-http-check-only" },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /farmer@example.test/);
    assert.doesNotMatch(html, /name="email"/);
    console.log("PASS signup keeps the named pending inbox");
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
