import type {
  CurrentAirQuality,
} from "@/features/weather/types/air-quality";

import type {
  DustCondition,
  DustVisualIntensity,
} from "@/features/weather/types/weather-dust";

const DUST_DOMINANCE_RATIO = 0.5;

const PM10_MODERATE_THRESHOLD = 45;
const PM10_POOR_THRESHOLD = 120;
const PM10_EXTREME_THRESHOLD = 270;

const AOD_HAZY_THRESHOLD = 0.4;
const AOD_HIGH_THRESHOLD = 1;
const AOD_DUST_EVENT_THRESHOLD = 1.5;

function resolveDustIntensity(
  pm10: number,
  aerosolOpticalDepth: number | null,
): DustVisualIntensity | null {
  if (
    pm10 > PM10_EXTREME_THRESHOLD ||
    (
      aerosolOpticalDepth !== null &&
      aerosolOpticalDepth >=
        AOD_DUST_EVENT_THRESHOLD
    )
  ) {
    return "heavy";
  }

  if (
    pm10 > PM10_POOR_THRESHOLD ||
    (
      aerosolOpticalDepth !== null &&
      aerosolOpticalDepth >=
        AOD_HIGH_THRESHOLD
    )
  ) {
    return "moderate";
  }

  if (
    pm10 > PM10_MODERATE_THRESHOLD ||
    (
      aerosolOpticalDepth !== null &&
      aerosolOpticalDepth >=
        AOD_HAZY_THRESHOLD
    )
  ) {
    return "light";
  }

  return null;
}

export function resolveDustCondition(
  airQuality: CurrentAirQuality,
): DustCondition {
  const {
    dust,
    pm10,
    aerosolOpticalDepth,
  } = airQuality;

  if (
    dust === null ||
    pm10 === null ||
    pm10 <= 0
  ) {
    return {
      status: "unavailable",
      isDusty: false,
      intensity: null,
      dustShare: null,
    };
  }

  const dustShare = Math.max(
    0,
    Math.min(1, dust / pm10),
  );

  const isDustDominant =
    dustShare >= DUST_DOMINANCE_RATIO;

  if (!isDustDominant) {
    return {
      status: "not-dusty",
      isDusty: false,
      intensity: null,
      dustShare,
    };
  }

  const intensity = resolveDustIntensity(
    pm10,
    aerosolOpticalDepth,
  );

  if (!intensity) {
    return {
      status: "not-dusty",
      isDusty: false,
      intensity: null,
      dustShare,
    };
  }

  return {
    status: "dusty",
    isDusty: true,
    intensity,
    dustShare,
  };
}