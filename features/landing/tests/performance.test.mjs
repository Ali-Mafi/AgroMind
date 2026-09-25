import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { PassThrough } from "node:stream";
import { localizedRenderer } from "../../settings/tests/helpers/render.mjs";
import { loadTs, localRequire } from "../../weather/tests/helpers/load-ts.mjs";

const React = localRequire("react");
const source = (file) => readFileSync(file, "utf8");

for (const language of ["en", "fa"]) {
  test(`${language}: landing content is visible in SSR without hydration`, () => {
    const ui = localizedRenderer({ language });
    for (const [file, name] of [
      ["hero", "Hero"], ["value-proposition", "ValueProposition"],
      ["feature-highlights", "FeatureHighlights"], ["capabilities", "Capabilities"],
      ["pwa-install", "PwaInstall"], ["cta", "CTA"],
    ]) {
      const Component = ui.load(`features/landing/components/${file}.tsx`)[name];
      const html = ui.renderToStaticMarkup(React.createElement(Component));
      assert.match(html, /<h[123]/, file);
      assert.doesNotMatch(html, /style="[^"]*(?:opacity:\s*0(?:;|")|visibility:\s*hidden)/, file);
      assert.doesNotMatch(html, /transform:translateY\(16px\)/, file);
    }
  });

  test(`${language}: Weather fallback SSR renders a visible, non-private skeleton`, () => {
    const ui = localizedRenderer({ language });
    for (const file of ["app/weather/loading.tsx"]) {
      const Loading = ui.load(file).default;
      const html = ui.renderToStaticMarkup(React.createElement(Loading));
      assert.match(html, /aria-busy="true"/);
      assert.match(html, /role="status"/);
      assert.match(html, /bg-muted/);
      assert.doesNotMatch(html, /fixture-user|farmer@example|opacity:0/);
    }
  });
}

test("the navbar uses a bounded retina logo and not the full-resolution source", async () => {
  const ui = localizedRenderer();
  const { Navbar } = ui.load("features/landing/components/navbar.tsx");
  const html = ui.renderToStaticMarkup(React.createElement(Navbar));
  assert.match(html, /src="\/logo\/agromind-mark-132-v1.webp"/);
  assert.match(html, /width="132" height="132"/);
  assert.doesNotMatch(html, /agromind-logo.png/);
  const path = "public/logo/agromind-mark-132-v1.webp";
  assert.ok(statSync(path).size < 20_000);
  // Lossless encoding of the resampled original, including transparency. No
  // redrawing, color changes, crop, background replacement or new artwork.
  const sharp = localRequire("sharp");
  const original = await sharp("public/logo/agromind-logo.png").resize(132, 132).raw().toBuffer();
  const resized = await sharp(path).raw().toBuffer();
  // WebP may canonicalize RGB of entirely transparent pixels; compare visible
  // RGB plus alpha so invisible source-pixel garbage doesn't affect equality.
  for (let offset = 0; offset < original.length; offset += 4) {
    assert.equal(resized[offset + 3], original[offset + 3]);
    if (original[offset + 3])
      assert.deepEqual(resized.subarray(offset, offset + 3), original.subarray(offset, offset + 3));
  }
});

test("motion is not a root/landing dependency; theme motion remains opt-in", () => {
  for (const file of ["app/providers/theme-provider.tsx", "features/landing/components/landing-motion.tsx"])
    assert.doesNotMatch(source(file), /framer-motion/);
  assert.match(source("app/components/theme-switcher.tsx"), /MotionConfig reducedMotion="user"/);
  assert.match(source("features/landing/landing.module.css"), /prefers-reduced-motion: reduce/);
});

test("region dialog is loaded only for a hydrated, unconfirmed landing visit", () => {
  function Dialog() { return null; }
  for (const [path, hydrated, confirmed, shown] of [
    ["/", false, false, false], ["/", true, false, true], ["/", true, true, false],
    ["/dashboard", true, false, false], ["/farms", true, false, false],
    ["/account", true, false, false], ["/weather", true, false, false],
  ]) {
    const { RegionOnboardingEntry } = loadTs("features/settings/components/region-onboarding-entry.tsx", {
      "next/dynamic": { default: (_importer, options) => { assert.equal(options.ssr, false); return Dialog; } },
      "next/navigation": { usePathname: () => path },
      "../context/settings-context": { useSettings: () => ({ isHydrated: hydrated, preferences: { regionConfirmed: confirmed } }) },
    });
    const element = RegionOnboardingEntry();
    assert.equal(element?.type === Dialog, shown, path);
  }
  assert.match(source("app/layout.tsx"), /<RegionOnboardingEntry \/>/);
});

test("PWA registration has one persistent owner and waits for document load", () => {
  assert.doesNotMatch(source("features/landing/components/pwa-install.tsx"), /serviceWorker\.register/);
  const registration = source("features/authentication/components/pwa-session-safety.tsx");
  assert.equal([...registration.matchAll(/\.register\(/g)].length, 1);
  assert.match(registration, /document.readyState === "complete"/);
  assert.match(registration, /requestIdleCallback/);
  assert.doesNotMatch(registration, /registration\.update\(/);
});

test("workspace skeleton streams before a pending private layout without exposing its data", async () => {
  const { renderToPipeableStream } = localRequire("react-dom/server");
  const { WorkspaceLoadingBoundary } = loadTs("components/layout/workspace-loading-boundary.tsx", {
    "@/features/settings/components/translated-text": { T: ({ text }) => text },
  });
  let resolve;
  let settled = false;
  const privateResult = new Promise(done => { resolve = done; });
  function PendingLayout() {
    React.use(privateResult);
    return React.createElement("div", null, "private-fixture-only");
  }
  const destination = new PassThrough();
  const chunks = [];
  let firstChunk;
  const first = new Promise(done => { firstChunk = done; });
  destination.on("data", chunk => {
    chunks.push(chunk.toString());
    firstChunk();
  });
  const end = new Promise((resolve, reject) => {
    destination.once("end", resolve);
    destination.once("error", reject);
  });
  const stream = renderToPipeableStream(React.createElement("html", null,
    React.createElement("body", null,
      React.createElement(WorkspaceLoadingBoundary, null, React.createElement(PendingLayout)),
    ),
  ), {
    bootstrapScripts: ["/test-only.js"],
    onShellReady() { stream.pipe(destination); },
  });
  const deadline = setTimeout(() => { stream.abort(); destination.destroy(new Error("No streaming fallback")); }, 3000);
  try {
    await Promise.race([first, end]);
    assert.equal(settled, false);
    assert.match(chunks.join(""), /data-route-loading/);
    assert.doesNotMatch(chunks.join(""), /private-fixture-only/);
    settled = true;
    resolve();
    await end;
    assert.match(chunks.join(""), /private-fixture-only/);
  } finally {
    clearTimeout(deadline);
    stream.abort();
  }
});

test("each profiled workspace wraps the unchanged auth gate, not the reverse", () => {
  for (const route of ["dashboard", "farms", "assistant", "account", "weather", "settings", "irrigation"]) {
    assert.match(source(`app/${route}/layout.tsx`), /<WorkspaceLoadingBoundary><ProtectedLayout/);
  }
  assert.doesNotMatch(source("app/layout.tsx"), /WorkspaceLoadingBoundary/);
  assert.doesNotMatch(source("app/mfa/page.tsx"), /WorkspaceLoadingBoundary/);
});
