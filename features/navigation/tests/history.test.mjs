import test from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "../../weather/tests/helpers/load-ts.mjs";
const {
  suitablePrevious,
  fallbackForRoute,
  installHistoryTracking,
  HISTORY_KEY,
  navigateBack,
} = loadTs("features/navigation/lib/history.ts");
const origin = "https://agromind.ir";
function browser(path = "/dashboard", referrer = "") {
  const win = new EventTarget();
  let entries = [
      { url: origin + path, data: { __NA: true, tree: "next-tree" } },
    ],
    index = 0;
  Object.defineProperty(win, "location", {
    get: () => new URL(entries[index].url),
  });
  win.document = { referrer };
  win.history = {
    get state() {
      return entries[index].data;
    },
    get length() {
      return entries.length;
    },
    pushState(data, title, url) {
      entries = entries.slice(0, index + 1);
      entries.push({
        data,
        url: new URL(url ?? entries[index].url, entries[index].url).href,
      });
      index++;
    },
    replaceState(data, title, url) {
      entries[index] = {
        data,
        url: new URL(url ?? entries[index].url, entries[index].url).href,
      };
    },
    back() {
      if (index > 0) index--;
      win.dispatchEvent(new Event("popstate"));
    },
  };
  return win;
}
for (const from of ["/dashboard?farm=a", "/irrigation?farm=a", "/farms/a"]) {
  test(`Back returns to the actual origin ${from}, including query context`, () => {
    const win = browser(from);
    const uninstall = installHistoryTracking(win);
    win.history.pushState({ __NA: true, tree: "new" }, "", "/weather?farm=a");
    assert.equal(win.history.state[HISTORY_KEY], true);
    assert.equal(win.history.state.tree, "new");
    win.history.back();
    assert.equal(win.location.pathname + win.location.search, from);
    uninstall();
  });
}
test("replace, reload and form edit preserve the real browser entry", () => {
  const win = browser("/farms");
  let uninstall = installHistoryTracking(win);
  win.history.pushState({ __NA: true }, "", "/farms/a");
  win.history.pushState({ __NA: true }, "", "/farms/a/edit");
  win.history.replaceState({ __NA: true }, "", "/farms/a/edit?view=details");
  uninstall();
  uninstall = installHistoryTracking(win);
  win.history.back();
  assert.equal(win.location.pathname, "/farms/a");
  win.history.back();
  assert.equal(win.location.pathname, "/farms");
  uninstall();
});
test("external/referrer-free entry and sensitive authentication pages do not become Back targets", () => {
  for (const from of [
    "https://other.test/dashboard",
    "/auth/callback?code=secret",
    "/reset-password?token=x",
    "/verify-email",
    "/mfa",
    "/sign-in",
  ])
    assert.equal(suitablePrevious(from, "/dashboard", origin), false);
  assert.equal(suitablePrevious("/sign-in", "/forgot-password", origin), true);
  const win = browser("/weather?farm=a");
  installHistoryTracking(win);
  assert.equal(win.history.state[HISTORY_KEY], false);
});
test("direct entries have safe contextual fallbacks and no external redirects", () => {
  assert.equal(fallbackForRoute("/weather", "a"), "/farms/a");
  assert.equal(fallbackForRoute("/weather", "//evil.test"), "/dashboard");
  assert.equal(fallbackForRoute("/farms/a/edit"), "/farms/a");
  assert.equal(fallbackForRoute("/farms/a"), "/farms");
  assert.equal(fallbackForRoute("/account/security"), "/account");
  assert.equal(fallbackForRoute("/sign-in"), "/");
});
test("shared Back action calls router.back; fallback only for direct entries", () => {
  const before = globalThis.window;
  const win = browser("/farms/a");
  globalThis.window = win;
  try {
    installHistoryTracking(win);
    let result;
    const router = {
      back() {
        result = "back";
      },
      replace(href) {
        result = href;
      },
    };
    navigateBack(router, "https://evil.test");
    assert.equal(result, "/farms");
    win.history.pushState({}, "", "/farms/a/edit");
    navigateBack(router);
    assert.equal(result, "back");
  } finally {
    globalThis.window = before;
  }
});
