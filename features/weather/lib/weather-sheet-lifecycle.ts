/** Keep the native modal/focus trap alive until its compositor-only exit ends. */
export function mountWeatherSheet(dialog: HTMLDialogElement, onClose: () => void) {
  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const previousOverflow = document.body.style.overflow;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let active = true;
  let closing = false;
  let notified = false;
  let animation: Animation | null = null;

  const notifyClosed = () => {
    if (active && !notified) { notified = true; onClose(); }
  };
  const cancel = () => { animation?.cancel(); animation = null; };
  dialog.showModal();
  document.body.style.overflow = "hidden";

  if (!reduced.matches && typeof dialog.animate === "function") {
    const entering = dialog.animate([
      { transform: "translateY(var(--weather-sheet-travel))", opacity: 0 },
      { transform: "translateY(0)", opacity: 1 },
    ], { duration: 300, easing: "cubic-bezier(.22, 1, .36, 1)", fill: "both" });
    animation = entering;
    void entering.finished.then(() => {
      if (active && animation === entering && !closing) cancel();
    }).catch(() => {}); // Cancellation is expected on close or navigation.
  }

  const close = () => {
    if (!active || closing) return;
    closing = true;
    if (reduced.matches || typeof dialog.animate !== "function") {
      cancel(); notifyClosed(); return;
    }
    // Sample once, so closing during entry continues from the visible position.
    const style = getComputedStyle(dialog);
    const start = { transform: style.transform, opacity: style.opacity };
    cancel();
    const leaving = dialog.animate([
      start, { transform: "translateY(var(--weather-sheet-travel))", opacity: 0 },
    ], { duration: 220, easing: "cubic-bezier(.4, 0, 1, 1)", fill: "forwards" });
    animation = leaving;
    void leaving.finished.then(notifyClosed).catch(() => {
      if (active && animation === leaving) notifyClosed();
    });
  };
  const motionChanged = () => {
    if (reduced.matches) { cancel(); if (closing) notifyClosed(); }
  };
  reduced.addEventListener("change", motionChanged);

  return {
    close,
    dispose() {
      if (!active) return;
      active = false;
      cancel();
      reduced.removeEventListener("change", motionChanged);
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    },
  };
}
