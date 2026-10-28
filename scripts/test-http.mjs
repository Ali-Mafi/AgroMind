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

  for (const route of ["/admin/support", "/admin/support/verify", "/account/help/tickets/00000000-0000-4000-8000-000000000000"]) {
    const response = await fetch(base + route, { redirect: "manual" });
    assert.equal(response.status, 307);
    assert.match(response.headers.get("location"), /sign-in/);
    assert.match(response.headers.get("cache-control"), /no-store/);
  }
  assert.equal((await fetch(base + "/api/support/notifications")).status, 401);
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

  // Public notices must render in both supported locales without a session.
  for (const url of ["/privacy", "/cookies", "/terms"]) {
    for (const lang of ["en", "fa"]) {
      const cookie = "agromind_display_v1=" + encodeURIComponent(JSON.stringify({ version:1, country: lang === "fa" ? "IR" : "US", language:lang, regionConfirmed:true }));
      const response = await fetch(base + url, { headers:{ cookie } });
      assert.equal(response.status, 200, url);
      const html = await response.text();
      const heading = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "";
      assert.ok(heading.length > 5, url);
      assert.equal(/[\u0600-\u06ff]/.test(heading), lang === "fa");
      for (const path of ["/privacy", "/cookies", "/terms"]) assert.ok(html.includes('href="' + path + '"'));
      assert.match(html, /support@agromind\.ir/);
      console.log("PASS public legal page", url, lang);
    }
  }

  for (const path of ["/privacy", "/cookies", "/terms"]) {
    for (const language of ["en","fa"]) {
      const cookie = "agromind_display_v1=" + encodeURIComponent(JSON.stringify({
        version: 1, country: language === "fa" ? "IR" : "US",
        language, regionConfirmed: true,
      }));
      const response = await fetch(base + path, { headers: { cookie } });
      assert.equal(response.status, 200, path);
      const html = await response.text();
      assert.match(html, language === "fa" ? /سیاست|شرایط/ : /Privacy|Cookie|Terms/);
      for (const href of ["/privacy","/cookies","/terms"]) assert.ok(html.includes('href="' + href + '"'));
      assert.match(html, /support@agromind\.ir/);
      console.log("PASS legal public route", path, language);
    }
  }

  for (const asset of ["wheat-field.jpg", "logo.png", "footer-curve.png", "instagram.png", "telegram.png", "shield.png", "highlight-1.png", "highlight-2.png", "highlight-3.png"]) {
    const response = await fetch(base + "/email/signature-v1/" + asset, { redirect: "manual" });
    assert.equal(response.status, 200, asset);
    assert.match(response.headers.get("content-type"), asset.endsWith(".jpg") ? /image\/jpeg/ : /image\/png/);
    assert.ok((await response.arrayBuffer()).byteLength < 150_000, asset);
  }
  console.log("PASS public email assets: no session/redirect required, JPEG/PNG within byte budgets");
  for (const asset of ["landscape.jpg", "signature-leaf.png", "footer-curve.png", "footer-leaves.png", "shield.png", "highlight-1.png", "highlight-2.png", "highlight-3.png"]) {
    const response = await fetch(base + "/email/signature-v2/" + asset, { redirect: "manual" });
    assert.equal(response.status, 200, asset);
    assert.match(response.headers.get("content-type"), asset.endsWith(".jpg") ? /image\/jpeg/ : /image\/png/);
    assert.ok((await response.arrayBuffer()).byteLength < 150_000, asset);
  }
  console.log("PASS integrated Signature artwork: public JPEG/PNG within byte budgets");
  // Versioned image URLs must resolve, even when a receiving email client or
  // image proxy has cached an earlier pre-release 404 under the unversioned URL.
  for (const path of [
    "/email/signature-v2/signature-leaf.png?v=20261028r2",
    "/email/signature-v2/shield.png?v=20261028r2",
    "/email/signature-v1/instagram.png?v=20261028r2",
    "/email/signature-v1/telegram.png?v=20261028r2",
    "/email/signature-v2/landscape.jpg?v=20261028r2",
  ]) {
    const response = await fetch(base + path, { redirect: "manual" });
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type"), /image\/(?:png|jpeg)/, path);
  }
  console.log("PASS email image cache-revision URLs resolve publicly");

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
    assert.match(head, /name="apple-mobile-web-app-status-bar-style" content="black-translucent"/);
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
