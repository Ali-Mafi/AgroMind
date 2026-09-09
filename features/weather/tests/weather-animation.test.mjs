import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTs, localRequire } from "./helpers/load-ts.mjs";

function canvasEnvironment(t) {
  const document = new EventTarget(); document.hidden = false;
  const reduced = new EventTarget(); reduced.matches = false;
  const pending = new Map(); let nextId = 0; let cleanup;
  t.after(() => cleanup?.());
  const draws = { strokes: 0, lines: 0, clears: 0 };
  const context = {
    setTransform() {}, beginPath() {}, moveTo() {}, arc() {}, fill() {}, fillRect() {},
    lineTo() { draws.lines++; }, stroke() { draws.strokes++; }, clearRect() { draws.clears++; },
  };
  const canvas = { width: 0, height: 0, getContext: () => context,
    getBoundingClientRect: () => ({ width: 3840, height: 2160 }) };
  const observers = [];
  class Observer {
    constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); }
    observe() {} disconnect() { this.disconnected = true; }
  }
  const globals = {
    document, navigator: { hardwareConcurrency: 8 }, window: { matchMedia: () => reduced },
    ResizeObserver: Observer, IntersectionObserver: Observer,
    requestAnimationFrame: (callback) => { pending.set(++nextId, callback); return nextId; },
    cancelAnimationFrame: (id) => pending.delete(id),
  };
  for (const [name, value] of Object.entries(globals)) {
    const before = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() => before ? Object.defineProperty(globalThis, name, before) : delete globalThis[name]);
  }
  const { WeatherParticles } = loadTs("features/weather/components/weather-particles/index.tsx", {
    react: { useRef: () => ({ current: canvas }), useEffect: (effect) => { cleanup = effect(); } },
  });
  WeatherParticles({ kind: "rain", intensity: "heavy", lightning: false });
  const step = (time) => {
    const callbacks = [...pending.values()]; pending.clear(); callbacks.forEach((callback) => callback(time));
  };
  return { document, reduced, pending, canvas, draws, observers, step, dispose: () => cleanup() };
}

test("heavy rain retains density at 4K while limiting canvas pixels and batching three strokes", (t) => {
  const env = canvasEnvironment(t);
  assert.ok(env.canvas.width * env.canvas.height < 1_402_000);
  assert.equal(env.pending.size, 1);
  env.step(100); env.step(116.7);
  assert.equal(env.pending.size, 1);
  assert.equal(env.draws.strokes, 6);
  assert.equal(env.draws.lines, 640); // 320 drops per frame, not 320 draw calls.
});

test("rain stops when hidden, offscreen or reduced-motion, and releases callbacks on unmount", (t) => {
  const env = canvasEnvironment(t);
  env.document.hidden = true; env.document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(env.pending.size, 0);
  env.document.hidden = false; env.document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(env.pending.size, 1);
  env.observers[1].callback([{ isIntersecting: false }]); assert.equal(env.pending.size, 0);
  env.observers[1].callback([{ isIntersecting: true }]); assert.equal(env.pending.size, 1);
  env.reduced.matches = true; env.reduced.dispatchEvent(new Event("change"));
  assert.equal(env.pending.size, 0); assert.ok(env.draws.clears > 0);
  env.reduced.matches = false; env.reduced.dispatchEvent(new Event("change"));
  assert.equal(env.pending.size, 1);
  env.dispose(); assert.equal(env.pending.size, 0);
  assert.ok(env.observers.every((observer) => observer.disconnected));
  env.document.dispatchEvent(new Event("visibilitychange")); assert.equal(env.pending.size, 0);
});

test("clear skies and the pause toggle do not mount an animation canvas", () => {
  const React = localRequire("react");
  const { renderToStaticMarkup } = localRequire("react-dom/server");
  const { WeatherBackground } = loadTs("features/weather/components/weather-background/index.tsx");
  const render = (props) => renderToStaticMarkup(React.createElement(WeatherBackground, props));
  assert.ok(!render({ visualState: "clear-day" }).includes("<canvas"));
  assert.ok(!render({ visualState: "clear-night" }).includes("<canvas"));
  assert.ok(render({ visualState: "heavy-rain-day" }).includes("<canvas"));
  assert.ok(!render({ visualState: "heavy-rain-day", animationsEnabled: false }).includes("<canvas"));
});
