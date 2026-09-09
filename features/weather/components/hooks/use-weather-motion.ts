"use client";

import { useSyncExternalStore } from "react";

const KEY = "agromind-weather-motion";
const CHANGE = "agromind-weather-motion-change";
let memoryEnabled = true;

function subscribe(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE, onChange);
  return () => {
    query.removeEventListener("change", onChange);
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE, onChange);
  };
}

function getEnabled() {
  try { return localStorage.getItem(KEY) !== "off"; } catch { return memoryEnabled; }
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useWeatherMotion() {
  const enabled = useSyncExternalStore(subscribe, getEnabled, () => true);
  const reducedMotion = useSyncExternalStore(subscribe, getReducedMotion, () => false);
  return {
    enabled: enabled && !reducedMotion,
    reducedMotion,
    toggle: () => {
      memoryEnabled = !enabled;
      try { localStorage.setItem(KEY, memoryEnabled ? "on" : "off"); } catch { /* Keep the preference for this tab. */ }
      window.dispatchEvent(new Event(CHANGE));
    },
  };
}
