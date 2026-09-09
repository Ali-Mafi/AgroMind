// Paste this entire file into browser DevTools on a loaded /weather page.
// Scroll normally during the 15-second sample; repeat in clear and rainy weather.
// Measures this browser/device only. No data leaves the browser.
void (async () => {
  if (!document.querySelector('[data-weather-temperature="current"]') || document.hidden) {
    console.error("Open a fully loaded, visible Weather page before measuring.");
    return;
  }
  const duration = 15000;
  const intervals = [];
  const longTasks = [];
  let previous = 0;
  let frame = 0;
  let hidden = false;
  const onVisibility = () => { hidden ||= document.hidden; };
  document.addEventListener("visibilitychange", onVisibility);
  const observer = typeof PerformanceObserver !== "undefined" && PerformanceObserver.supportedEntryTypes.includes("longtask")
    ? new PerformanceObserver((list) => longTasks.push(...list.getEntries().map((entry) => entry.duration))) : null;
  observer?.observe({ type: "longtask" });
  const sample = (time) => {
    if (previous) intervals.push(time - previous);
    previous = time;
    frame = requestAnimationFrame(sample);
  };
  console.info("AgroMind FPS: measuring for 15 seconds. Scroll the Weather page normally.");
  frame = requestAnimationFrame(sample);
  await new Promise((resolve) => setTimeout(resolve, duration));
  cancelAnimationFrame(frame);
  observer?.disconnect();
  document.removeEventListener("visibilitychange", onVisibility);
  if (hidden || intervals.length < 2) {
    console.warn("Sample invalid: the page was hidden or too few frames were received. Repeat while visible.");
    return;
  }
  const sorted = [...intervals].sort((a, b) => a - b);
  const percentile = (fraction) => sorted[Math.ceil(sorted.length * fraction) - 1].toFixed(2);
  console.table({
    condition: document.querySelector("[data-weather-state]")?.getAttribute("data-weather-state"),
    viewport: `${innerWidth} × ${innerHeight}, DPR ${devicePixelRatio}`,
    averageFps: (intervals.length * 1000 / intervals.reduce((sum, value) => sum + value, 0)).toFixed(1),
    p95FrameMs: percentile(.95), p99FrameMs: percentile(.99),
    framesOver50ms: intervals.filter((value) => value > 50).length,
    longTasks: observer ? longTasks.length : "unsupported",
    totalLongTaskMs: observer ? Math.round(longTasks.reduce((sum, value) => sum + value, 0)) : "unsupported",
    canvases: document.querySelectorAll("canvas").length,
  });
})();
