"use client";

import { memo, useEffect, useState } from "react";
import { weatherBackgroundCandidates } from "@/features/weather/lib/weather-background-assets";
import { WeatherParticles, type WeatherParticlesProps } from "../weather-particles";
import type { WeatherVisualState } from "@/features/weather/types/weather-visual";
import styles from "./weather-background.module.css";

interface WeatherBackgroundProps {
  visualState: WeatherVisualState;
  className?: string;
  animationsEnabled?: boolean;
  precipitating?: boolean;
}

function weatherEffects(state: WeatherVisualState, precipitating: boolean): WeatherParticlesProps {
  const lightning = state.startsWith("storm-") || state.startsWith("hail-");
  const snow = state.startsWith("snow-") || state.startsWith("heavy-snow-");
  const rain = /^(drizzle|rain|heavy-rain|storm)-/.test(state);
  const heavy = state.startsWith("heavy-") || lightning;
  return {
    kind: !precipitating ? "none" : snow ? "snow" : state.startsWith("hail-") ? "hail" : rain ? "rain" : "none",
    intensity: heavy ? "heavy" : state.startsWith("drizzle-") ? "light" : "moderate",
    lightning,
  };
}

export const WeatherBackground = memo(function WeatherBackground({
  visualState, className = "", animationsEnabled = true, precipitating = true,
}: WeatherBackgroundProps) {
  const [image, setImage] = useState<{ state: WeatherVisualState; url: string } | null>(null);
  const night = visualState.endsWith("-night");
  const effects = weatherEffects(visualState, precipitating);

  useEffect(() => {
    const candidates = weatherBackgroundCandidates(visualState);
    let active = true;
    let loading: HTMLImageElement | null = null;
    let index = 0;
    const next = () => {
      if (!active || index >= candidates.length) return;
      const url = candidates[index++];
      loading = new Image();
      loading.decoding = "async";
      loading.onload = () => { if (active) setImage({ state: visualState, url }); };
      loading.onerror = next;
      loading.src = url;
    };
    next();
    return () => {
      active = false;
      if (loading) { loading.onload = null; loading.onerror = null; }
    };
  }, [visualState]);

  // Never flash a previous farm's clear sky while a storm image is loading.
  const imageUrl = image?.state === visualState ? image.url : null;
  return (
    <div className={`${styles.background} ${night ? styles.night : styles.day} ${className}`}
      data-weather-state={visualState} aria-hidden="true">
      {imageUrl && <div className={styles.image} style={{ backgroundImage: `url("${imageUrl}")` }} />}
      <div className={styles.atmosphere} />
      {animationsEnabled && (effects.kind !== "none" || effects.lightning) && <WeatherParticles {...effects} />}
      <div className={styles.vignette} />
    </div>
  );
});
