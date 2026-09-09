import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTs } from "./helpers/load-ts.mjs";

const { mountWeatherSheet } = loadTs("features/weather/lib/weather-sheet-lifecycle.ts");
const flush = () => new Promise((resolve) => setImmediate(resolve));

function environment(t, prefersReducedMotion = false) {
  let controller;
  t.after(() => controller?.dispose());
  const media = new EventTarget(); media.matches = prefersReducedMotion;
  class Element {}
  const opener = new Element(); opener.isConnected = true; opener.focus = () => { counts.focus++; };
  const counts = { closed: 0, focus: 0 };
  const document = { activeElement: opener, body: { style: { overflow: "auto" } } };
  const animations = [];
  const dialog = {
    open: false,
    showModal() { this.open = true; },
    close() { this.open = false; },
    animate(frames, options) {
      let resolve, reject;
      const finished = new Promise((yes, no) => { resolve = yes; reject = no; });
      const animation = { frames, options, finished, cancelled: false,
        finish: () => resolve(), cancel() { this.cancelled = true; reject(new Error("cancelled")); } };
      animations.push(animation);
      return animation;
    },
  };
  const globals = { document, HTMLElement: Element, window: { matchMedia: () => media },
    getComputedStyle: () => ({ transform: "matrix(1, 0, 0, 1, 0, 18)", opacity: "0.6" }) };
  for (const [name, value] of Object.entries(globals)) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() => previous ? Object.defineProperty(globalThis, name, previous) : delete globalThis[name]);
  }
  return { media, document, dialog, animations, counts, mount: () => {
    controller = mountWeatherSheet(dialog, () => { counts.closed++; });
    return controller;
  } };
}

test("sheet stays modal and locks scrolling through exit, then restores focus after unmount", async (t) => {
  const env = environment(t); const sheet = env.mount();
  assert.equal(env.dialog.open, true); assert.equal(env.document.body.style.overflow, "hidden");
  env.animations[0].finish(); await flush();
  sheet.close(); sheet.close();
  assert.equal(env.animations.length, 2); assert.equal(env.counts.closed, 0);
  assert.equal(env.dialog.open, true); assert.equal(env.counts.focus, 0);
  env.animations[1].finish(); await flush();
  assert.equal(env.counts.closed, 1);
  sheet.dispose();
  assert.equal(env.dialog.open, false); assert.equal(env.document.body.style.overflow, "auto");
  assert.equal(env.counts.focus, 1);
});

test("closing during entry uses the visible position and navigation cancels pending callbacks", async (t) => {
  const env = environment(t); const sheet = env.mount();
  sheet.close();
  assert.equal(env.animations[0].cancelled, true);
  assert.equal(env.animations[1].frames[0].transform, "matrix(1, 0, 0, 1, 0, 18)");
  sheet.dispose();
  await flush();
  assert.equal(env.animations[1].cancelled, true);
  assert.equal(env.counts.closed, 0);
  env.media.matches = true; env.media.dispatchEvent(new Event("change"));
  assert.equal(env.counts.closed, 0);
});

test("reduced motion skips sliding and a changed preference completes a pending exit once", async (t) => {
  const env = environment(t, true); const sheet = env.mount();
  assert.equal(env.animations.length, 0);
  sheet.close(); sheet.close(); assert.equal(env.counts.closed, 1);
  sheet.dispose();
  env.media.matches = false;
  const next = env.mount(); next.close();
  env.media.matches = true; env.media.dispatchEvent(new Event("change"));
  await flush(); assert.equal(env.counts.closed, 2);
});

test("browsers without the animation API can still open and dismiss details", (t) => {
  const env = environment(t); delete env.dialog.animate;
  const sheet = env.mount(); assert.equal(env.dialog.open, true);
  sheet.close(); assert.equal(env.counts.closed, 1);
});
