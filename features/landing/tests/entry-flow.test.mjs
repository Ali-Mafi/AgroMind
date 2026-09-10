import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { localizedRenderer } from "../../settings/tests/helpers/render.mjs";
import { localRequire, root } from "../../weather/tests/helpers/load-ts.mjs";

const React = localRequire("react");
for (const language of ["en", "fa"]) {
  test(`${language}: landing entry links lead to installation or web sign-in`, () => {
    const { load, renderToStaticMarkup: render } = localizedRenderer({ language });
    const { Navbar } = load("features/landing/components/navbar.tsx");
    const { Hero } = load("features/landing/components/hero.tsx");
    const { CTA } = load("features/landing/components/cta.tsx");
    const header = render(React.createElement(Navbar));
    assert.match(header, /href="#install"/);
    assert.match(header, /href="\/login"/);
    assert.ok(header.includes(language === "fa" ? "شروع مدیریت" : "Start managing"));
    for (const Component of [Navbar, Hero, CTA]) {
      const html = render(React.createElement(Component));
      assert.match(html, /href="\/login"/);
      assert.doesNotMatch(html, /href="\/(dashboard|farms\/new)"/);
    }
  });

  test(`${language}: installation is opt-in with Android marked unavailable`, () => {
    const { load, renderToStaticMarkup: render } = localizedRenderer({ language });
    const { PwaInstall } = load("features/landing/components/pwa-install.tsx");
    const html = render(React.createElement(PwaInstall));
    assert.match(html, /id="install"/);
    assert.match(html, /<button[^>]*disabled=""[^>]*>/);
    assert.match(html, /aria-haspopup="dialog"/);
    assert.doesNotMatch(html, /role="dialog"/);
    assert.ok(html.includes(language === "fa" ? "به‌زودی" : "Coming soon"));
    assert.ok(html.includes(language === "fa" ? "نصب روی آیفون یا آیپد" : "Install on iPhone or iPad"));
  });

  test(`${language}: login and signup routes render honest localized entry screens`, () => {
    const { load, renderToStaticMarkup: render } = localizedRenderer({ language });
    for (const [route, destination] of [["login", "signup"], ["signup", "login"]]) {
      const Page = load(`app/${route}/page.tsx`).default;
      const html = render(React.createElement(Page));
      assert.match(html, new RegExp(`href="/${destination}"`));
      assert.match(html, /role="status"/);
      assert.ok(html.includes(language === "fa" ? "هنوز فعال نیست" : "not available yet"));
      assert.doesNotMatch(html, /<input|href="\/dashboard"/);
    }
  });
}

test("the installed PWA opens signup without changing the existing installation identity", () => {
  const manifest = JSON.parse(readFileSync(`${root}/public/manifest.webmanifest`, "utf8"));
  assert.equal(manifest.start_url, "/signup");
  assert.equal(manifest.id, "/dashboard");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.scope, "/");
  for (const icon of manifest.icons) {
    const png = readFileSync(`${root}/public${icon.src}`);
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
});

test("service worker does not intercept account routes, API requests, or submissions", () => {
  const listeners = {};
  vm.runInNewContext(readFileSync(`${root}/public/sw.js`, "utf8"), {
    self: { location: { origin: "https://agromind.test" }, addEventListener: (type, callback) => { listeners[type] = callback; } },
    URL,
  });
  for (const pathname of ["/login", "/login/", "/signup", "/signup/", "/api/weather"]) {
    listeners.fetch({ request: { url: `https://agromind.test${pathname}`, method: "GET" }, respondWith: () => assert.fail(`intercepted ${pathname}`) });
  }
  listeners.fetch({ request: { url: "https://agromind.test/", method: "POST" }, respondWith: () => assert.fail("intercepted form submission") });
});
