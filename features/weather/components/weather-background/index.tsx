import {
  resolveWeatherBackground,
} from "@/features/weather/lib/resolve-weather-background";

import type {
  WeatherVisualState,
} from "@/features/weather/types/weather-visual";

import styles from "./weather-background.module.css";

interface WeatherBackgroundProps {
  visualState: WeatherVisualState;
  className?: string;
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

      <div
        className={styles.vignette}
      />
    </div>
  );
}