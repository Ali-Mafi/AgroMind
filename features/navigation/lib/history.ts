export const HISTORY_KEY = "__agromindBack";
export const NAVIGATION_START = "agromind:navigation-start";
export const NAVIGATION_COMPLETE = "agromind:navigation-complete";

// Only a boolean is attached to each browser entry. Never persist auth URLs,
// query tokens, account data or a second, synthetic navigation stack.
export function suitablePrevious(from: string, to: string, origin: string) {
  try {
    const previous = new URL(from, origin);
    const next = new URL(to, origin);
    if (
      previous.origin !== origin ||
      next.origin !== origin ||
      previous.href === next.href
    )
      return false;
    if (/^\/(auth|verify-email|reset-password)(\/|$)/.test(previous.pathname))
      return false;
    const authPage = /^\/(sign-in|sign-up|forgot-password|login|signup)(\/|$)/;
    if (authPage.test(previous.pathname) && !authPage.test(next.pathname))
      return false;
    return (
      previous.pathname === "/" ||
      /^\/(dashboard|farms|weather|irrigation|assistant|account|settings|onboarding|sign-in|sign-up|forgot-password|login|signup)(\/|$)/.test(
        previous.pathname,
      )
    );
  } catch {
    return false;
  }
}
export function fallbackForRoute(pathname: string, farm?: string | null) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "farms")
    return parts.length > 2 ? `/farms/${parts[1]}` : "/farms";
  if ((parts[0] === "account" && parts.length > 1) || parts[0] === "settings")
    return "/account";
  if (parts[0] === "weather" || parts[0] === "irrigation")
    return farm && /^[\w-]{1,128}$/.test(farm)
      ? `/farms/${encodeURIComponent(farm)}`
      : "/dashboard";
  if (["sign-in", "sign-up", "login", "signup"].includes(parts[0])) return "/";
  if (
    ["forgot-password", "reset-password", "verify-email", "mfa"].includes(
      parts[0],
    )
  )
    return "/sign-in";
  return "/dashboard";
}
export function installHistoryTracking(win: Window) {
  const history = win.history;
  const originalPush = history.pushState;
  const originalReplace = history.replaceState;
  const complete = () => win.dispatchEvent(new Event(NAVIGATION_COMPLETE));
  const mark = (data: unknown, back: boolean) => ({
    ...(data && typeof data === "object" ? data : {}),
    [HISTORY_KEY]: back,
  });
  if (typeof history.state?.[HISTORY_KEY] !== "boolean") {
    originalReplace.call(
      history,
      mark(
        history.state,
        Boolean(win.document.referrer) &&
          history.length > 1 &&
          suitablePrevious(
            win.document.referrer,
            win.location.href,
            win.location.origin,
          ),
      ),
      "",
    );
  }
  const push: History["pushState"] = function (data, title, url) {
    const next =
      url == null ? win.location.href : new URL(url, win.location.href).href;
    originalPush.call(
      history,
      mark(
        data,
        suitablePrevious(win.location.href, next, win.location.origin),
      ),
      title,
      url,
    );
    complete();
  };
  const replace: History["replaceState"] = function (data, title, url) {
    originalReplace.call(
      history,
      mark(data, history.state?.[HISTORY_KEY] === true),
      title,
      url,
    );
    complete();
  };
  history.pushState = push;
  history.replaceState = replace;
  win.addEventListener("popstate", complete);
  return () => {
    if (history.pushState === push) history.pushState = originalPush;
    if (history.replaceState === replace)
      history.replaceState = originalReplace;
    win.removeEventListener("popstate", complete);
  };
}

export function navigateBack(
  router: { back(): void; replace(href: string): void },
  fallback?: string,
) {
  window.dispatchEvent(new Event(NAVIGATION_START));
  if (
    window.history.state?.[HISTORY_KEY] === true &&
    window.history.length > 1
  ) {
    router.back();
    return;
  }
  const safe =
    fallback && /^\/(?!\/)[\w/-]*$/.test(fallback)
      ? fallback
      : fallbackForRoute(
          window.location.pathname,
          new URLSearchParams(window.location.search).get("farm"),
        );
  router.replace(safe);
}
