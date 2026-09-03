import type {
  WeatherVisualState,
} from "@/features/weather/types/weather-visual";

import styles from "./weather-background.module.css";

interface WeatherBackgroundProps {
  visualState: WeatherVisualState;

  className?: string;
}

function getVisualCondition(
  visualState: WeatherVisualState,
) {
  return visualState.replace(
    /-(day|night)$/,
    "",
  );
}

export function WeatherBackground({
  visualState,
  className = "",
}: WeatherBackgroundProps) {
  const isNight =
    visualState.endsWith("-night");

  const condition =
    getVisualCondition(visualState);

  const hasCloudAtmosphere =
    condition === "partly-cloudy" ||
    condition === "cloudy" ||
    condition === "drizzle" ||
    condition === "rain" ||
    condition === "heavy-rain" ||
    condition === "snow" ||
    condition === "heavy-snow" ||
    condition === "storm" ||
    condition === "hail";

  const hasRain =
    condition === "drizzle" ||
    condition === "rain" ||
    condition === "heavy-rain" ||
    condition === "storm" ||
    condition === "hail";

  const hasSnow =
    condition === "snow" ||
    condition === "heavy-snow";

  const hasFog =
    condition === "fog";

  const hasLightning =
    condition === "storm" ||
    condition === "hail";

  return (
    <div
      className={[
        styles.background,
        styles[condition],
        isNight
          ? styles.night
          : styles.day,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    >
      <div className={styles.sky} />

      <div className={styles.atmosphere} />

      {hasCloudAtmosphere && (
        <>
          <div
            className={[
              styles.cloudLayer,
              styles.cloudLayerBack,
            ].join(" ")}
          />

          <div
            className={[
              styles.cloudLayer,
              styles.cloudLayerFront,
            ].join(" ")}
          />
        </>
      )}

      {hasRain && (
        <>
          <div
            className={[
              styles.precipitation,
              styles.rainBack,
            ].join(" ")}
          />

          <div
            className={[
              styles.precipitation,
              styles.rainFront,
            ].join(" ")}
          />
        </>
      )}

      {hasSnow && (
        <>
          <div
            className={[
              styles.snow,
              styles.snowBack,
            ].join(" ")}
          />

          <div
            className={[
              styles.snow,
              styles.snowFront,
            ].join(" ")}
          />
        </>
      )}

      {hasFog && (
        <>
          <div
            className={[
              styles.fog,
              styles.fogBack,
            ].join(" ")}
          />

          <div
            className={[
              styles.fog,
              styles.fogFront,
            ].join(" ")}
          />
        </>
      )}

      {hasLightning && (
        <div className={styles.lightning} />
      )}

      <div className={styles.grain} />

      <div className={styles.depth} />
    </div>
  );
}