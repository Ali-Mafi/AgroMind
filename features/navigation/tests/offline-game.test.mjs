import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const offline = await readFile("public/offline.html", "utf8");
const sw = await readFile("public/sw.js", "utf8");

test("offline fallback ships a self-contained Agro Runner game", () => {
  assert.match(offline, /Agro Runner/);
  assert.match(offline, /id="gameCanvas"/);
  assert.match(offline, /Farmer Dino is ready/);
  assert.match(offline, /agromind_agro_runner_best_v1/);
  assert.match(offline, /requestAnimationFrame/);
  assert.match(offline, /visibilitychange/);
  assert.match(offline, /pointerdown/);
  assert.match(offline, /ArrowUp/);
  assert.match(offline, /Space/);

  // The offline game must not depend on scripts, stylesheets, fonts or images
  // that would need another network request after the fallback document loads.
  assert.doesNotMatch(offline, /<script[^>]+src=/i);
  assert.doesNotMatch(offline, /<link[^>]+rel=["']stylesheet["']/i);
  assert.doesNotMatch(offline, /<img\b/i);
  assert.doesNotMatch(offline, /@import\b/i);
});

test("offline fallback localizes without mixing English and Persian UI", () => {
  assert.match(offline, /agromind_display_v1=/);
  assert.match(offline, /document\.documentElement\.lang = language/);
  assert.match(offline, /document\.documentElement\.dir = language === "fa"/);
  assert.match(offline, /querySelectorAll\("\[data-i18n\]"\)/);
  assert.match(offline, /fa:\s*\{/);
  assert.match(offline, /en:\s*\{/);
});

test("offline game preserves reconnect behavior without interrupting gameplay", () => {
  assert.match(offline, /window\.addEventListener\("online"/);
  assert.match(offline, /window\.addEventListener\("offline"/);
  assert.match(offline, /classList\.toggle\("show", online\)/);
  assert.match(offline, /window\.location\.reload\(\)/);
  assert.match(offline, /manifest\.webmanifest\?connection-check=/);
});

test("service worker precaches only the public offline shell and refreshes its version", () => {
  assert.match(sw, /agromind-public-v5/);
  assert.match(sw, /const SHELL = \["\/offline\.html"\]/);
  assert.match(sw, /event\.request\.mode === "navigate"/);
  assert.match(sw, /match\("\/offline\.html"\)/);

  // Authenticated documents, RSC and APIs must remain network-only.
  assert.match(sw, /RSC/);
  assert.match(sw, /_rsc/);
  assert.doesNotMatch(sw, /cache\.put\(event\.request, copy\)[\s\S]*text\/html/);
});
