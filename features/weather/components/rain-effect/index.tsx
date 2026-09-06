"use client";

import { useEffect, useRef } from "react";

export type RainIntensity = "light" | "moderate" | "heavy";

interface RainEffectProps {
  intensity: RainIntensity;
  isNight: boolean;
}

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  drift: number;
  opacity: number;
  width: number;
}

interface RainProfile {
  densityDivisor: number;
  minDrops: number;
  maxDrops: number;
  length: [number, number];
  speed: [number, number];
  opacity: [number, number];
  wind: number;
}

const RAIN_PROFILES: Record<RainIntensity, RainProfile> = {
  light: {
    densityDivisor: 16_000,
    minDrops: 18,
    maxDrops: 45,
    length: [10, 17],
    speed: [520, 760],
    opacity: [0.16, 0.28],
    wind: -55,
  },
  moderate: {
    densityDivisor: 8_500,
    minDrops: 32,
    maxDrops: 85,
    length: [12, 22],
    speed: [650, 940],
    opacity: [0.2, 0.36],
    wind: -72,
  },
  heavy: {
    densityDivisor: 5_000,
    minDrops: 55,
    maxDrops: 130,
    length: [16, 29],
    speed: [820, 1_180],
    opacity: [0.24, 0.42],
    wind: -92,
  },
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createDrop(
  width: number,
  height: number,
  profile: RainProfile,
  fillViewport: boolean,
): RainDrop {
  const depth = randomBetween(0.45, 1);

  return {
    x: randomBetween(-60, width + 60),
    y: fillViewport
      ? randomBetween(-height * 0.1, height)
      : randomBetween(-120, -20),
    length: randomBetween(...profile.length) * depth,
    speed: randomBetween(...profile.speed) * depth,
    drift: profile.wind * depth,
    opacity: randomBetween(...profile.opacity) * depth,
    width: randomBetween(0.7, 1.25) * depth,
  };
}

export function RainEffect({ intensity, isNight }: RainEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });

    if (!canvas || !context) return;

    const profile = RAIN_PROFILES[intensity];
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    let width = 0;
    let height = 0;
    let drops: RainDrop[] = [];
    let frameId: number | null = null;
    let previousTime = 0;
    let isIntersecting = true;

    const populateDrops = () => {
      const hardwareScale =
        (navigator.hardwareConcurrency ?? 8) <= 4 ? 0.72 : 1;
      const requestedCount = Math.round(
        (width * height) / profile.densityDivisor,
      );
      const count = Math.round(
        Math.min(
          profile.maxDrops,
          Math.max(profile.minDrops, requestedCount),
        ) * hardwareScale,
      );

      drops = Array.from({ length: count }, () =>
        createDrop(width, height, profile, true),
      );
    };

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;

      if (!width || !height) return;

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      populateDrops();
    };

    const resetDrop = (drop: RainDrop) => {
      Object.assign(
        drop,
        createDrop(width, height, profile, false),
      );
    };

    const render = (time: number) => {
      if (document.hidden || !isIntersecting || reducedMotion.matches) {
        frameId = null;
        return;
      }

      const delta = previousTime
        ? Math.min((time - previousTime) / 1_000, 0.034)
        : 0;
      previousTime = time;

      context.clearRect(0, 0, width, height);
      context.lineCap = "round";

      for (const drop of drops) {
        drop.x += drop.drift * delta;
        drop.y += drop.speed * delta;

        if (drop.y > height + drop.length || drop.x < -80) {
          resetDrop(drop);
        }

        context.beginPath();
        context.moveTo(drop.x, drop.y);
        context.lineTo(
          drop.x + (drop.drift / drop.speed) * drop.length,
          drop.y + drop.length,
        );
        context.lineWidth = drop.width;
        context.strokeStyle = isNight
          ? `rgba(213, 231, 255, ${drop.opacity})`
          : `rgba(63, 95, 119, ${drop.opacity})`;
        context.stroke();
      }

      frameId = window.requestAnimationFrame(render);
    };

    const stop = () => {
      if (frameId === null) return;
      window.cancelAnimationFrame(frameId);
      frameId = null;
    };

    const start = () => {
      if (
        frameId !== null ||
        document.hidden ||
        !isIntersecting ||
        reducedMotion.matches
      ) {
        return;
      }

      previousTime = 0;
      frameId = window.requestAnimationFrame(render);
    };

    const handleVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    const handleMotionPreference = () => {
      if (!reducedMotion.matches) {
        start();
        return;
      }

      stop();
      context.clearRect(0, 0, width, height);
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry?.isIntersecting ?? false;
        if (isIntersecting) start();
        else stop();
      },
      { threshold: 0.01 },
    );

    resizeCanvas();
    resizeObserver.observe(canvas);
    intersectionObserver.observe(canvas);
    document.addEventListener("visibilitychange", handleVisibility);
    reducedMotion.addEventListener("change", handleMotionPreference);
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      reducedMotion.removeEventListener("change", handleMotionPreference);
    };
  }, [intensity, isNight]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}