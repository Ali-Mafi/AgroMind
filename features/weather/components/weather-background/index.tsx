import {
  resolveWeatherBackground,
} from "@/features/weather/lib/resolve-weather-background";

import {
  RainEffect,
} from "@/features/weather/components/rain-effect";

import type {
  RainIntensity,
} from "@/features/weather/components/rain-effect";

import type {
  WeatherVisualState,
} from "@/features/weather/types/weather-visual";

import styles from "./weather-background.module.css";

interface WeatherBackgroundProps {
  visualState: WeatherVisualState;
  className?: string;
}

function resolveRainIntensity(
  visualState: WeatherVisualState,
): RainIntensity | null {
  if (visualState.startsWith("drizzle-")) {
    return "light";
  }

  if (visualState.startsWith("rain-")) {
    return "moderate";
  }

  if (
    visualState.startsWith("heavy-rain-") ||
    visualState.startsWith("storm-") ||
    visualState.startsWith("hail-")
  ) {
    return "heavy";
  }

  return null;
}

export function WeatherBackground({
  visualState,
  className = "",
}: WeatherBackgroundProps) {
  const backgroundImage =
    resolveWeatherBackground(
      visualState,
    );

  const isNight =
    visualState.endsWith("-night");

  const rainIntensity =
    resolveRainIntensity(visualState);

  return (
    <div
      className={[
        styles.background,
        isNight
          ? styles.night
          : styles.day,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    >
      <div
        className={styles.image}
        style={{
          backgroundImage: `url("${backgroundImage}")`,
        }}
      />

      <div
        className={styles.atmosphere}
      />

      {rainIntensity && (
        <RainEffect
          intensity={rainIntensity}
          isNight={isNight}
        />
      )}

      <div
        className={styles.vignette}
      />
    </div>
  );
}